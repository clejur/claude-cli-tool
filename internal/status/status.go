package status

import (
	"path/filepath"
	"strings"

	"github.com/shirou/gopsutil/v3/process"

	"github.com/clejur/claude-launcher/internal/model"
)

type ProcessInfo struct {
	PID int32
	Exe string
	Cwd string
}

type ProjectStatus struct {
	Project model.Project
	Running bool
	PID     int32
}

func MatchProjects(projects []model.Project, processes []ProcessInfo) []ProjectStatus {
	results := make([]ProjectStatus, len(projects))

	for i, proj := range projects {
		results[i] = ProjectStatus{Project: proj, Running: false}
		for _, proc := range processes {
			if pathsEqual(proc.Cwd, proj.Path) {
				results[i].Running = true
				results[i].PID = proc.PID
				break
			}
		}
	}
	return results
}

func ScanProcesses() ([]ProcessInfo, error) {
	procs, err := process.Processes()
	if err != nil {
		return nil, err
	}

	seen := make(map[string]bool)
	var infos []ProcessInfo
	for _, p := range procs {
		name, err := p.Name()
		if err != nil {
			continue
		}
		lower := strings.ToLower(name)

		var cwd string
		if lower == "claude" || lower == "claude.exe" {
			c, err := p.Cwd()
			if err != nil {
				continue
			}
			cwd = c
		} else if isShellProcess(lower) {
			cmdline, err := p.CmdlineSlice()
			if err != nil || !cmdlineContainsClaude(cmdline) {
				continue
			}
			cwd = resolveCwd(p, cmdline)
		} else if lower == "node" || lower == "node.exe" {
			cmdline, err := p.CmdlineSlice()
			if err != nil || !isClaudeCodeNode(cmdline) {
				continue
			}
			cwd = resolveCwd(p, cmdline)
		} else {
			continue
		}
		if cwd == "" {
			continue
		}
		key := strings.ToLower(filepath.Clean(cwd))
		if seen[key] {
			continue
		}
		seen[key] = true
		infos = append(infos, ProcessInfo{
			PID: p.Pid,
			Exe: name,
			Cwd: cwd,
		})
	}
	return infos, nil
}

func isShellProcess(lower string) bool {
	return lower == "pwsh" || lower == "pwsh.exe" ||
		lower == "powershell" || lower == "powershell.exe" ||
		strings.Contains(lower, "powershell")
}

func cmdlineContainsClaude(args []string) bool {
	for _, arg := range args {
		if strings.Contains(strings.ToLower(arg), "claude") {
			return true
		}
	}
	return false
}

func isClaudeCodeNode(args []string) bool {
	for _, arg := range args {
		if strings.Contains(strings.ToLower(arg), "claude-code/cli.js") {
			return true
		}
	}
	return false
}

func resolveCwd(p *process.Process, cmdline []string) string {
	cwd, err := p.Cwd()
	if err != nil {
		return parseWorkingDirectory(cmdline)
	}
	// If Cwd is system32, it's likely wrong (WT-launched shells report this)
	if strings.EqualFold(filepath.Clean(cwd), `C:\Windows\system32`) || strings.EqualFold(filepath.Clean(cwd), `C:\Windows\System32`) {
		if parsed := parseWorkingDirectory(cmdline); parsed != "" {
			return parsed
		}
	}
	return cwd
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

func pathsEqual(a, b string) bool {
	a = filepath.Clean(a)
	b = filepath.Clean(b)
	return strings.EqualFold(a, b)
}
