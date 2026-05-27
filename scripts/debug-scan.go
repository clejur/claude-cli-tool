package main

import (
	"fmt"
	"strings"

	"github.com/shirou/gopsutil/v3/process"
)

func main() {
	procs, err := process.Processes()
	if err != nil {
		fmt.Printf("[ERROR] Failed to list processes: %v\n", err)
		return
	}

	fmt.Printf("[INFO] Total system processes: %d\n\n", len(procs))

	fmt.Println("=== Step 1: Scanning for claude/powershell/pwsh/node processes ===")
	fmt.Println()

	var matched int
	for _, p := range procs {
		name, err := p.Name()
		if err != nil {
			continue
		}
		lower := strings.ToLower(name)

		isTarget := lower == "claude" || lower == "claude.exe" ||
			lower == "pwsh" || lower == "pwsh.exe" ||
			lower == "powershell" || lower == "powershell.exe" ||
			strings.Contains(lower, "powershell") ||
			lower == "node" || lower == "node.exe"

		if !isTarget {
			continue
		}

		cmdline, cmdErr := p.CmdlineSlice()
		if cmdErr != nil {
			cmdline = nil
		}
		cmdlineStr, _ := p.Cmdline()

		// For node.exe, only show if cmdline contains "claude"
		if lower == "node" || lower == "node.exe" {
			if !containsClaude(cmdline) && !strings.Contains(strings.ToLower(cmdlineStr), "claude") {
				continue
			}
		}

		matched++
		fmt.Printf("--- PID %d ---\n", p.Pid)
		fmt.Printf("  Name: %s\n", name)

		if cmdErr != nil {
			fmt.Printf("  CmdlineSlice: [ERROR] %v\n", cmdErr)
		} else {
			fmt.Printf("  CmdlineSlice: %v\n", cmdline)
		}
		fmt.Printf("  Cmdline (raw): %s\n", cmdlineStr)

		cwd, cwdErr := p.Cwd()
		if cwdErr != nil {
			fmt.Printf("  Cwd: [ERROR] %v\n", cwdErr)
		} else {
			fmt.Printf("  Cwd: %s\n", cwd)
		}

		// Try to parse -WorkingDirectory from cmdline
		workDir := parseWorkingDirectory(cmdline)
		if workDir != "" {
			fmt.Printf("  Parsed -WorkingDirectory: %s\n", workDir)
		}

		hasClaude := containsClaude(cmdline)
		fmt.Printf("  Contains 'claude' in cmdline: %v\n", hasClaude)

		// Print parent process info
		printParentInfo(p)
		fmt.Println()
	}

	if matched == 0 {
		fmt.Println("[WARN] No matching processes found!")
	} else {
		fmt.Printf("[INFO] Found %d matching processes\n", matched)
	}

	// Step 2: Find shell processes that have claude-related children
	fmt.Println()
	fmt.Println("=== Step 2: Shell processes with claude-related children ===")
	fmt.Println()

	shellCount := 0
	for _, p := range procs {
		name, err := p.Name()
		if err != nil {
			continue
		}
		lower := strings.ToLower(name)
		if lower != "pwsh.exe" && lower != "pwsh" &&
			lower != "powershell.exe" && lower != "powershell" &&
			lower != "cmd.exe" && lower != "cmd" {
			continue
		}

		children, err := p.Children()
		if err != nil || len(children) == 0 {
			continue
		}

		var claudeChildren []string
		for _, child := range children {
			childName, _ := child.Name()
			childCmdline, _ := child.Cmdline()
			childLower := strings.ToLower(childName)

			isClaude := childLower == "claude" || childLower == "claude.exe" ||
				strings.Contains(strings.ToLower(childCmdline), "claude")

			if isClaude {
				childCwd, _ := child.Cwd()
				claudeChildren = append(claudeChildren, fmt.Sprintf(
					"PID=%d Name=%s Cwd=%s Cmd=%s",
					child.Pid, childName, childCwd, truncate(childCmdline, 120)))
			}
		}

		if len(claudeChildren) > 0 {
			shellCount++
			cwd, _ := p.Cwd()
			cmdlineStr, _ := p.Cmdline()
			fmt.Printf("--- Shell PID %d ---\n", p.Pid)
			fmt.Printf("  Name: %s\n", name)
			fmt.Printf("  Cwd: %s\n", cwd)
			fmt.Printf("  Cmdline: %s\n", truncate(cmdlineStr, 120))
			fmt.Printf("  Claude children (%d):\n", len(claudeChildren))
			for _, c := range claudeChildren {
				fmt.Printf("    %s\n", c)
			}
			printParentInfo(p)
			fmt.Println()
		}
	}

	if shellCount == 0 {
		fmt.Println("[INFO] No shell processes with claude children found")
	}

	// Step 3: Any process with "claude" anywhere
	fmt.Println()
	fmt.Println("=== Step 3: ALL processes with 'claude' in name or cmdline ===")
	fmt.Println()

	anyFound := false
	for _, p := range procs {
		name, _ := p.Name()
		cmdlineStr, _ := p.Cmdline()
		if strings.Contains(strings.ToLower(name), "claude") ||
			strings.Contains(strings.ToLower(cmdlineStr), "claude") {
			anyFound = true
			cwd, cwdErr := p.Cwd()
			cwdStr := cwd
			if cwdErr != nil {
				cwdStr = fmt.Sprintf("[ERROR] %v", cwdErr)
			}
			ppid, _ := p.Ppid()
			fmt.Printf("  PID %-6d  PPID %-6d  Name: %-20s  Cwd: %s\n", p.Pid, ppid, name, cwdStr)
			fmt.Printf("              Cmdline: %s\n", truncate(cmdlineStr, 150))
			fmt.Println()
		}
	}
	if !anyFound {
		fmt.Println("[INFO] No processes with 'claude' found at all")
	}
}

func printParentInfo(p *process.Process) {
	ppid, err := p.Ppid()
	if err != nil {
		fmt.Printf("  Parent: [ERROR] %v\n", err)
		return
	}
	fmt.Printf("  PPID: %d\n", ppid)

	parent, err := process.NewProcess(ppid)
	if err != nil {
		fmt.Printf("  Parent info: [ERROR] cannot open parent: %v\n", err)
		return
	}

	parentName, _ := parent.Name()
	parentCwd, parentCwdErr := parent.Cwd()
	parentCmd, _ := parent.Cmdline()

	fmt.Printf("  Parent Name: %s\n", parentName)
	if parentCwdErr != nil {
		fmt.Printf("  Parent Cwd: [ERROR] %v\n", parentCwdErr)
	} else {
		fmt.Printf("  Parent Cwd: %s\n", parentCwd)
	}
	fmt.Printf("  Parent Cmdline: %s\n", truncate(parentCmd, 120))
}

func containsClaude(args []string) bool {
	for _, arg := range args {
		if strings.Contains(strings.ToLower(arg), "claude") {
			return true
		}
	}
	return false
}

func parseWorkingDirectory(args []string) string {
	for i, arg := range args {
		lower := strings.ToLower(arg)
		if lower == "-workingdirectory" || lower == "--working-directory" {
			if i+1 < len(args) {
				return strings.Trim(args[i+1], "\"")
			}
		}
		if strings.HasPrefix(lower, "-workingdirectory=") {
			return strings.Trim(strings.SplitN(arg, "=", 2)[1], "\"")
		}
	}
	return ""
}

func truncate(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max] + "..."
}
