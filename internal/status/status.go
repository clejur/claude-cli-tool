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

	var infos []ProcessInfo
	for _, p := range procs {
		name, err := p.Name()
		if err != nil {
			continue
		}
		lower := strings.ToLower(name)

		if lower == "claude" || lower == "claude.exe" {
			cwd, err := p.Cwd()
			if err != nil {
				continue
			}
			infos = append(infos, ProcessInfo{
				PID: p.Pid,
				Exe: name,
				Cwd: cwd,
			})
		} else if isShellProcess(lower) {
			cmdline, err := p.CmdlineSlice()
			if err != nil || !cmdlineContainsClaude(cmdline) {
				continue
			}
			cwd, err := p.Cwd()
			if err != nil {
				continue
			}
			infos = append(infos, ProcessInfo{
				PID: p.Pid,
				Exe: name,
				Cwd: cwd,
			})
		}
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

func pathsEqual(a, b string) bool {
	a = filepath.Clean(a)
	b = filepath.Clean(b)
	return strings.EqualFold(a, b)
}
