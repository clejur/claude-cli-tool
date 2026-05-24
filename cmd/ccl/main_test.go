package main

import (
	"path/filepath"
	"testing"

	"github.com/clejur/claude-launcher/internal/config"
	"github.com/clejur/claude-launcher/internal/group"
	"github.com/clejur/claude-launcher/internal/launcher"
	"github.com/clejur/claude-launcher/internal/project"
	"github.com/clejur/claude-launcher/internal/workspace"
)

func setupTestEnv(t *testing.T) {
	dir := t.TempDir()
	store = config.NewStore(filepath.Join(dir, "config.json"))
	projectSvc = project.NewService(store)
	groupSvc = group.NewService(store)
	workspaceSvc = workspace.NewService(store)
	launcherSvc = launcher.New()
}

func TestFullWorkflow(t *testing.T) {
	setupTestEnv(t)

	err := groupSvc.Add("backend")
	if err != nil {
		t.Fatalf("add group: %v", err)
	}

	p1, err := projectSvc.Add("api", "API Server", `D:\projects\api`, "claude", "backend")
	if err != nil {
		t.Fatalf("add project: %v", err)
	}
	p2, err := projectSvc.Add("web", "Web App", `D:\projects\web`, "claude --resume", "backend")
	if err != nil {
		t.Fatalf("add project: %v", err)
	}

	projects, err := projectSvc.List("backend")
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(projects) != 2 {
		t.Fatalf("expected 2 projects, got %d", len(projects))
	}

	ws, err := workspaceSvc.Save("daily", []string{p1.Name, p2.Name})
	if err != nil {
		t.Fatalf("save workspace: %v", err)
	}
	if len(ws.ProjectIDs) != 2 {
		t.Fatalf("expected 2 IDs in workspace, got %d", len(ws.ProjectIDs))
	}

	resolved, err := workspaceSvc.Resolve("daily")
	if err != nil {
		t.Fatalf("resolve workspace: %v", err)
	}
	if len(resolved) != 2 {
		t.Fatalf("expected 2 resolved projects, got %d", len(resolved))
	}

	cfg, err := store.Load()
	if err != nil {
		t.Fatalf("load config: %v", err)
	}
	if len(cfg.Projects) != 2 {
		t.Fatalf("config should have 2 projects, got %d", len(cfg.Projects))
	}

	err = projectSvc.Remove("api")
	if err != nil {
		t.Fatalf("remove: %v", err)
	}
	projects, _ = projectSvc.List("")
	if len(projects) != 1 {
		t.Fatalf("expected 1 project after remove, got %d", len(projects))
	}
}
