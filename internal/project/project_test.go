package project

import (
	"path/filepath"
	"testing"

	"github.com/clejur/claude-launcher/internal/config"
)

func newTestService(t *testing.T) *Service {
	dir := t.TempDir()
	store := config.NewStore(filepath.Join(dir, "config.json"))
	return NewService(store)
}

func TestAddProject(t *testing.T) {
	svc := newTestService(t)

	p, err := svc.Add("my-api", "API Server", "D:\\projects\\api", "claude", "backend")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if p.Name != "my-api" {
		t.Fatalf("expected name my-api, got %s", p.Name)
	}
	if p.ID == "" {
		t.Fatal("expected non-empty ID")
	}
}

func TestAddDuplicateName(t *testing.T) {
	svc := newTestService(t)

	_, _ = svc.Add("my-api", "API", "D:\\p1", "claude", "")
	_, err := svc.Add("my-api", "API2", "D:\\p2", "claude", "")
	if err == nil {
		t.Fatal("expected error for duplicate name")
	}
}

func TestListAll(t *testing.T) {
	svc := newTestService(t)
	_, _ = svc.Add("p1", "P1", "D:\\p1", "claude", "frontend")
	_, _ = svc.Add("p2", "P2", "D:\\p2", "claude", "backend")

	projects, err := svc.List("")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(projects) != 2 {
		t.Fatalf("expected 2 projects, got %d", len(projects))
	}
}

func TestListByGroup(t *testing.T) {
	svc := newTestService(t)
	_, _ = svc.Add("p1", "P1", "D:\\p1", "claude", "frontend")
	_, _ = svc.Add("p2", "P2", "D:\\p2", "claude", "backend")

	projects, err := svc.List("frontend")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(projects) != 1 {
		t.Fatalf("expected 1 project, got %d", len(projects))
	}
	if projects[0].Name != "p1" {
		t.Fatalf("expected p1, got %s", projects[0].Name)
	}
}

func TestFindByNameOrID(t *testing.T) {
	svc := newTestService(t)
	added, _ := svc.Add("my-api", "API", "D:\\api", "claude", "")

	byName, err := svc.Find("my-api")
	if err != nil {
		t.Fatalf("find by name error: %v", err)
	}
	if byName.ID != added.ID {
		t.Fatal("find by name returned wrong project")
	}

	byID, err := svc.Find(added.ID)
	if err != nil {
		t.Fatalf("find by id error: %v", err)
	}
	if byID.Name != "my-api" {
		t.Fatal("find by id returned wrong project")
	}
}

func TestRemoveProject(t *testing.T) {
	svc := newTestService(t)
	_, _ = svc.Add("my-api", "API", "D:\\api", "claude", "")

	err := svc.Remove("my-api")
	if err != nil {
		t.Fatalf("remove error: %v", err)
	}

	projects, _ := svc.List("")
	if len(projects) != 0 {
		t.Fatalf("expected 0 projects after remove, got %d", len(projects))
	}
}

func TestEditProject(t *testing.T) {
	svc := newTestService(t)
	_, _ = svc.Add("my-api", "API", "D:\\api", "claude", "backend")

	updated, err := svc.Edit("my-api", &EditOptions{Label: strPtr("New Label"), Group: strPtr("frontend")})
	if err != nil {
		t.Fatalf("edit error: %v", err)
	}
	if updated.Label != "New Label" {
		t.Fatalf("expected label New Label, got %s", updated.Label)
	}
	if updated.Group != "frontend" {
		t.Fatalf("expected group frontend, got %s", updated.Group)
	}
}

func strPtr(s string) *string { return &s }
