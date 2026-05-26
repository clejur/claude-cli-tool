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
		fmt.Println()
	}

	if matched == 0 {
		fmt.Println("[WARN] No matching processes found!")
		fmt.Println()
		fmt.Println("=== Step 2: Listing ALL processes with 'claude' in name or cmdline ===")
		fmt.Println()
		for _, p := range procs {
			name, _ := p.Name()
			cmdlineStr, _ := p.Cmdline()
			if strings.Contains(strings.ToLower(name), "claude") ||
				strings.Contains(strings.ToLower(cmdlineStr), "claude") {
				fmt.Printf("  PID %d  Name: %s\n", p.Pid, name)
				fmt.Printf("  Cmdline: %s\n", cmdlineStr)
				cwd, cwdErr := p.Cwd()
				if cwdErr != nil {
					fmt.Printf("  Cwd: [ERROR] %v\n", cwdErr)
				} else {
					fmt.Printf("  Cwd: %s\n", cwd)
				}
				fmt.Println()
			}
		}
	} else {
		fmt.Printf("[INFO] Found %d matching processes\n", matched)
	}
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
