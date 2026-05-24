package main

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"

	"github.com/clejur/claude-launcher/internal/config"
	"github.com/clejur/claude-launcher/internal/group"
	"github.com/clejur/claude-launcher/internal/launcher"
	"github.com/clejur/claude-launcher/internal/model"
	"github.com/clejur/claude-launcher/internal/project"
	"github.com/clejur/claude-launcher/internal/status"
	"github.com/clejur/claude-launcher/internal/workspace"
	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx          context.Context
	store        *config.Store
	projectSvc   *project.Service
	groupSvc     *group.Service
	workspaceSvc *workspace.Service
	launcherSvc  *launcher.Launcher
}

func NewApp() *App {
	store := config.NewStore(config.DefaultPath())
	return &App{
		store:        store,
		projectSvc:   project.NewService(store),
		groupSvc:     group.NewService(store),
		workspaceSvc: workspace.NewService(store),
		launcherSvc:  launcher.New(),
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.registerHotkey()
	a.setupTray()
}

func (a *App) Quit() {
	quitFromTray()
}

// Project bindings

func (a *App) AddProject(name, label, path, command, grp string) (*model.Project, error) {
	return a.projectSvc.Add(name, label, path, command, grp)
}

func (a *App) ListProjects(grp string) ([]model.Project, error) {
	return a.projectSvc.List(grp)
}

func (a *App) EditProject(nameOrID string, label, path, command, grp *string) (*model.Project, error) {
	opts := &project.EditOptions{
		Label:   label,
		Path:    path,
		Command: command,
		Group:   grp,
	}
	return a.projectSvc.Edit(nameOrID, opts)
}

func (a *App) RemoveProject(nameOrID string) error {
	return a.projectSvc.Remove(nameOrID)
}

func (a *App) StartProject(nameOrID string) error {
	p, err := a.projectSvc.Find(nameOrID)
	if err != nil {
		return err
	}
	return a.launcherSvc.Launch([]model.Project{*p})
}

func (a *App) StartProjects(names []string) error {
	var projects []model.Project
	for _, n := range names {
		p, err := a.projectSvc.Find(n)
		if err != nil {
			return err
		}
		projects = append(projects, *p)
	}
	return a.launcherSvc.Launch(projects)
}

func (a *App) StopProject(pid int32) error {
	proc, err := os.FindProcess(int(pid))
	if err != nil {
		return err
	}
	return proc.Kill()
}

// Status bindings

type ProjectStatusResult struct {
	Name    string `json:"name"`
	ID      string `json:"id"`
	Group   string `json:"group"`
	Running bool   `json:"running"`
	PID     int32  `json:"pid"`
}

func (a *App) GetStatus() ([]ProjectStatusResult, error) {
	projects, err := a.projectSvc.List("")
	if err != nil {
		return nil, err
	}
	processes, err := status.ScanProcesses()
	if err != nil {
		return nil, err
	}
	matched := status.MatchProjects(projects, processes)

	var results []ProjectStatusResult
	for _, m := range matched {
		results = append(results, ProjectStatusResult{
			Name:    m.Project.Name,
			ID:      m.Project.ID,
			Group:   m.Project.Group,
			Running: m.Running,
			PID:     m.PID,
		})
	}
	return results, nil
}

// Import bindings

type DetectedProcess struct {
	PID int32  `json:"pid"`
	Cwd string `json:"cwd"`
}

func (a *App) DetectUnregistered() ([]DetectedProcess, error) {
	processes, err := status.ScanProcesses()
	if err != nil {
		return nil, err
	}
	projects, err := a.projectSvc.List("")
	if err != nil {
		return nil, err
	}

	registered := make(map[string]bool)
	for _, p := range projects {
		registered[strings.ToLower(filepath.Clean(p.Path))] = true
	}

	var result []DetectedProcess
	for _, proc := range processes {
		key := strings.ToLower(filepath.Clean(proc.Cwd))
		if !registered[key] {
			result = append(result, DetectedProcess{PID: proc.PID, Cwd: proc.Cwd})
		}
	}
	return result, nil
}

// Group bindings

func (a *App) AddGroup(name string) error {
	return a.groupSvc.Add(name)
}

func (a *App) ListGroups() ([]string, error) {
	return a.groupSvc.List()
}

func (a *App) RemoveGroup(name string) error {
	return a.groupSvc.Remove(name)
}

// Workspace bindings

func (a *App) SaveWorkspace(name string, projectNames []string) (*model.Workspace, error) {
	return a.workspaceSvc.Save(name, projectNames)
}

func (a *App) ListWorkspaces() ([]model.Workspace, error) {
	return a.workspaceSvc.List()
}

func (a *App) RestoreWorkspace(name string) error {
	projects, err := a.workspaceSvc.Resolve(name)
	if err != nil {
		return err
	}
	return a.launcherSvc.Launch(projects)
}

func (a *App) UpdateWorkspace(name string, projectNames []string) (*model.Workspace, error) {
	return a.workspaceSvc.Update(name, projectNames)
}

func (a *App) RemoveWorkspace(name string) error {
	return a.workspaceSvc.Remove(name)
}

// Settings bindings

func (a *App) GetCloseToTray() (bool, error) {
	cfg, err := a.store.Load()
	if err != nil {
		return true, err
	}
	return cfg.Settings.CloseToTray, nil
}

func (a *App) SetCloseToTray(v bool) error {
	cfg, err := a.store.Load()
	if err != nil {
		return err
	}
	cfg.Settings.CloseToTray = v
	return a.store.Save(cfg)
}

// Directory picker

func (a *App) SelectDirectory() (string, error) {
	return wailsRuntime.OpenDirectoryDialog(a.ctx, wailsRuntime.OpenDialogOptions{})
}

// Config import/export

func (a *App) ExportConfig() (string, error) {
	path, err := wailsRuntime.SaveFileDialog(a.ctx, wailsRuntime.SaveDialogOptions{
		DefaultFilename: "claude-cli-launcher-config.json",
		Filters: []wailsRuntime.FileFilter{
			{DisplayName: "JSON Files", Pattern: "*.json"},
		},
	})
	if err != nil || path == "" {
		return "", err
	}
	cfg, err := a.store.Load()
	if err != nil {
		return "", err
	}
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return "", err
	}
	return path, os.WriteFile(path, data, 0644)
}

func (a *App) ImportConfig() error {
	path, err := wailsRuntime.OpenFileDialog(a.ctx, wailsRuntime.OpenDialogOptions{
		Filters: []wailsRuntime.FileFilter{
			{DisplayName: "JSON Files", Pattern: "*.json"},
		},
	})
	if err != nil || path == "" {
		return err
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	var cfg model.Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return err
	}
	return a.store.Save(&cfg)
}
