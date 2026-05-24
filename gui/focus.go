package main

import (
	"fmt"
	"os/exec"
	"strings"
	"syscall"
	"unsafe"

	"github.com/shirou/gopsutil/v3/process"
)

var (
	procEnumWindows              = user32.NewProc("EnumWindows")
	procGetWindowThreadProcessId = user32.NewProc("GetWindowThreadProcessId")
	procSetForegroundWindow      = user32.NewProc("SetForegroundWindow")
	procShowWindow               = user32.NewProc("ShowWindow")
	procIsWindowVisible          = user32.NewProc("IsWindowVisible")
	procIsIconic                 = user32.NewProc("IsIconic")
	procGetForegroundWindow      = user32.NewProc("GetForegroundWindow")
	procAttachThreadInput        = user32.NewProc("AttachThreadInput")
	procBringWindowToTop         = user32.NewProc("BringWindowToTop")

	kernel32               = syscall.NewLazyDLL("kernel32.dll")
	procGetCurrentThreadId = kernel32.NewProc("GetCurrentThreadId")
)

const (
	swRestore = 9
	swShow    = 5
)

const tabPrefix = "✳ "

func (a *App) FocusProject(pid int32, label string) error {
	termPID, err := findTerminalPID(pid)
	if err != nil {
		return err
	}

	tabTitle := tabPrefix + label

	if label != "" {
		hwnds := findAllWindowsByPID(uint32(termPID))
		if len(hwnds) == 0 {
			return fmt.Errorf("no visible window for PID %d", termPID)
		}
		if len(hwnds) == 1 {
			forceSetForegroundWindow(hwnds[0])
			focusTabByTitle(hwnds[0], tabTitle)
			return nil
		}
		hwnd, err := findWindowWithTab(hwnds, tabTitle)
		if err != nil {
			forceSetForegroundWindow(hwnds[0])
			focusTabByTitle(hwnds[0], tabTitle)
			return nil
		}
		forceSetForegroundWindow(hwnd)
		focusTabByTitle(hwnd, tabTitle)
		return nil
	}

	hwnd, err := findWindowByPID(uint32(termPID))
	if err != nil {
		return err
	}
	forceSetForegroundWindow(hwnd)
	return nil
}

func forceSetForegroundWindow(hwnd uintptr) {
	iconic, _, _ := procIsIconic.Call(hwnd)
	if iconic != 0 {
		procShowWindow.Call(hwnd, swRestore)
	}

	fgHwnd, _, _ := procGetForegroundWindow.Call()
	if fgHwnd == hwnd {
		return
	}

	var fgThreadID uint32
	if fgHwnd != 0 {
		ret, _, _ := procGetWindowThreadProcessId.Call(fgHwnd, 0)
		fgThreadID = uint32(ret)
	}
	curThreadID, _, _ := procGetCurrentThreadId.Call()

	if fgThreadID != 0 && fgThreadID != uint32(curThreadID) {
		procAttachThreadInput.Call(uintptr(curThreadID), uintptr(fgThreadID), 1)
		procBringWindowToTop.Call(hwnd)
		procSetForegroundWindow.Call(hwnd)
		procAttachThreadInput.Call(uintptr(curThreadID), uintptr(fgThreadID), 0)
	} else {
		procSetForegroundWindow.Call(hwnd)
	}
}

func focusTabByTitle(hwnd uintptr, title string) {
	script := fmt.Sprintf(`
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
$hwnd = [IntPtr]::new(%d)
$el = [System.Windows.Automation.AutomationElement]::FromHandle($hwnd)
$cond = New-Object System.Windows.Automation.PropertyCondition(
  [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
  [System.Windows.Automation.ControlType]::TabItem)
$tabs = $el.FindAll([System.Windows.Automation.TreeScope]::Descendants, $cond)
foreach ($tab in $tabs) {
  if ($tab.Current.Name -eq '%s') {
    $pattern = $tab.GetCurrentPattern([System.Windows.Automation.SelectionItemPattern]::Pattern)
    $pattern.Select()
    break
  }
}`, hwnd, strings.ReplaceAll(title, "'", "''"))

	cmd := exec.Command("powershell", "-NoProfile", "-NonInteractive", "-Command", script)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	cmd.Run()
}

// findWindowWithTab uses UI Automation to find which window contains a tab with the given title.
func findWindowWithTab(hwnds []uintptr, title string) (uintptr, error) {
	hwndStrs := make([]string, len(hwnds))
	for i, h := range hwnds {
		hwndStrs[i] = fmt.Sprintf("%d", h)
	}

	script := fmt.Sprintf(`
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
$hwnds = @(%s)
$cond = New-Object System.Windows.Automation.PropertyCondition(
  [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
  [System.Windows.Automation.ControlType]::TabItem)
foreach ($h in $hwnds) {
  $el = [System.Windows.Automation.AutomationElement]::FromHandle([IntPtr]::new($h))
  $tabs = $el.FindAll([System.Windows.Automation.TreeScope]::Descendants, $cond)
  foreach ($tab in $tabs) {
    if ($tab.Current.Name -eq '%s') {
      Write-Output $h
      exit
    }
  }
}`, strings.Join(hwndStrs, ","), strings.ReplaceAll(title, "'", "''"))

	cmd := exec.Command("powershell", "-NoProfile", "-NonInteractive", "-Command", script)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	out, err := cmd.Output()
	if err != nil {
		return 0, err
	}
	result := strings.TrimSpace(string(out))
	if result == "" {
		return 0, fmt.Errorf("tab not found in any window")
	}

	var hwnd uintptr
	fmt.Sscanf(result, "%d", &hwnd)
	if hwnd == 0 {
		return 0, fmt.Errorf("invalid hwnd from script")
	}
	return hwnd, nil
}

func findTerminalPID(childPID int32) (int32, error) {
	p, err := process.NewProcess(childPID)
	if err != nil {
		return 0, fmt.Errorf("process %d not found", childPID)
	}
	for {
		parent, err := p.Parent()
		if err != nil || parent == nil {
			break
		}
		name, _ := parent.Name()
		if strings.EqualFold(name, "WindowsTerminal.exe") {
			return parent.Pid, nil
		}
		p = parent
	}
	return 0, fmt.Errorf("terminal window not found for PID %d", childPID)
}

func findAllWindowsByPID(pid uint32) []uintptr {
	var hwnds []uintptr
	cb := syscall.NewCallback(func(hwnd uintptr, lParam uintptr) uintptr {
		var windowPID uint32
		procGetWindowThreadProcessId.Call(hwnd, uintptr(unsafe.Pointer(&windowPID)))
		if windowPID == pid {
			visible, _, _ := procIsWindowVisible.Call(hwnd)
			if visible != 0 {
				hwnds = append(hwnds, hwnd)
			}
		}
		return 1
	})
	procEnumWindows.Call(cb, 0)
	return hwnds
}

func findWindowByPID(pid uint32) (uintptr, error) {
	hwnds := findAllWindowsByPID(pid)
	if len(hwnds) == 0 {
		return 0, fmt.Errorf("no visible window for PID %d", pid)
	}
	return hwnds[0], nil
}
