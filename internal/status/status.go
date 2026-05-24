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
			if isClaudeProcess(proc.Exe) && pathsEqual(proc.Cwd, proj.Path) {
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
		if !isClaudeProcess(name) {
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
	return infos, nil
}

func isClaudeProcess(name string) bool {
	lower := strings.ToLower(name)
	return lower == "claude" || lower == "claude.exe"
}

func pathsEqual(a, b string) bool {
	a = filepath.Clean(a)
	b = filepath.Clean(b)
	return strings.EqualFold(a, b)
}
