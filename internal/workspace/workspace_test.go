package workspace

import (
	"path/filepath"
	"testing"

	"github.com/clejur/claude-launcher/internal/config"
	"github.com/clejur/claude-launcher/internal/model"
)

func setupTest(t *testing.T) (*Service, *config.Store) {
	dir := t.TempDir()
	store := config.NewStore(filepath.Join(dir, "config.json"))

	cfg := &model.Config{
		Projects: []model.Project{
			{ID: "id1", Label: "api"},
			{ID: "id2", Label: "web"},
			{ID: "id3", Label: "tool"},
		},
		Groups:     []string{},
		Workspaces: []model.Workspace{},
	}
	_ = store.Save(cfg)

	return NewService(store), store
}

func TestSaveWorkspace(t *testing.T) {
	svc, _ := setupTest(t)

	ws, err := svc.Save("daily", []string{"api", "web"})
	if err != nil {
		t.Fatalf("save error: %v", err)
	}
	if ws.Name != "daily" {
		t.Fatalf("expected name daily, got %s", ws.Name)
	}
	if len(ws.ProjectIDs) != 2 {
		t.Fatalf("expected 2 project IDs, got %d", len(ws.ProjectIDs))
	}
}

func TestSaveDuplicateName(t *testing.T) {
	svc, _ := setupTest(t)
	_, _ = svc.Save("daily", []string{"api"})

	_, err := svc.Save("daily", []string{"web"})
	if err == nil {
		t.Fatal("expected error for duplicate workspace name")
	}
}

func TestListWorkspaces(t *testing.T) {
	svc, _ := setupTest(t)
	_, _ = svc.Save("daily", []string{"api"})
	_, _ = svc.Save("weekend", []string{"web"})

	workspaces, err := svc.List()
	if err != nil {
		t.Fatalf("list error: %v", err)
	}
	if len(workspaces) != 2 {
		t.Fatalf("expected 2 workspaces, got %d", len(workspaces))
	}
}

func TestResolveWorkspace(t *testing.T) {
	svc, _ := setupTest(t)
	_, _ = svc.Save("daily", []string{"api", "web"})

	projects, err := svc.Resolve("daily")
	if err != nil {
		t.Fatalf("resolve error: %v", err)
	}
	if len(projects) != 2 {
		t.Fatalf("expected 2 projects, got %d", len(projects))
	}
}

func TestRemoveWorkspace(t *testing.T) {
	svc, _ := setupTest(t)
	_, _ = svc.Save("daily", []string{"api"})

	err := svc.Remove("daily")
	if err != nil {
		t.Fatalf("remove error: %v", err)
	}

	workspaces, _ := svc.List()
	if len(workspaces) != 0 {
		t.Fatalf("expected 0 workspaces, got %d", len(workspaces))
	}
}
