package main

import (
	"strings"
	"syscall"
	"unsafe"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

var (
	user32 = syscall.NewLazyDLL("user32.dll")

	procRegisterHotKey   = user32.NewProc("RegisterHotKey")
	procUnregisterHotKey = user32.NewProc("UnregisterHotKey")
	procGetMessage       = user32.NewProc("GetMessageW")
)

const (
	modAlt   = 0x0001
	modCtrl  = 0x0002
	modShift = 0x0004
	wmHotkey = 0x0312
	hotkeyID = 1
)

type msg struct {
	Hwnd    uintptr
	Message uint32
	WParam  uintptr
	LParam  uintptr
	Time    uint32
	Pt      struct{ X, Y int32 }
}

func (a *App) registerHotkey() {
	cfg, _ := a.store.Load()
	hotkey := "Ctrl+Shift+C"
	if cfg != nil && cfg.Settings.Hotkey != "" {
		hotkey = cfg.Settings.Hotkey
	}

	mod, vk := parseHotkey(hotkey)

	go func() {
		procRegisterHotKey.Call(0, hotkeyID, uintptr(mod), uintptr(vk))
		var m msg
		for {
			ret, _, _ := procGetMessage.Call(uintptr(unsafe.Pointer(&m)), 0, 0, 0)
			if ret == 0 {
				break
			}
			if m.Message == wmHotkey {
				a.toggleWindow()
			}
		}
	}()
}

func (a *App) reRegisterHotkey(hotkey string) {
	procUnregisterHotKey.Call(0, hotkeyID)
	mod, vk := parseHotkey(hotkey)
	procRegisterHotKey.Call(0, hotkeyID, uintptr(mod), uintptr(vk))
}

func (a *App) toggleWindow() {
	hwnd, _, _ := procGetForegroundWindow.Call()
	title, _ := syscall.UTF16PtrFromString("Claude CLI Launcher")
	myHwnd, _, _ := procFindWindow.Call(0, uintptr(unsafe.Pointer(title)))

	if hwnd == myHwnd && myHwnd != 0 {
		wailsRuntime.WindowHide(a.ctx)
	} else {
		wailsRuntime.WindowShow(a.ctx)
	}
}

func parseHotkey(s string) (mod int, vk int) {
	parts := strings.Split(strings.ToLower(s), "+")
	for _, p := range parts {
		p = strings.TrimSpace(p)
		switch p {
		case "ctrl":
			mod |= modCtrl
		case "shift":
			mod |= modShift
		case "alt":
			mod |= modAlt
		default:
			if len(p) == 1 && p[0] >= 'a' && p[0] <= 'z' {
				vk = int(p[0]) - 32 // 'a'=0x61 -> 'A'=0x41
			}
		}
	}
	return
}
