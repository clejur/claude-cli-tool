package group

import (
	"path/filepath"
	"testing"

	"github.com/clejur/claude-cli-tool/internal/config"
)

func newTestService(t *testing.T) *Service {
	dir := t.TempDir()
	store := config.NewStore(filepath.Join(dir, "config.json"))
	return NewService(store)
}

func TestAddGroup(t *testing.T) {
	svc := newTestService(t)

	err := svc.Add("backend")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	groups, _ := svc.List()
	if len(groups) != 1 || groups[0] != "backend" {
		t.Fatalf("expected [backend], got %v", groups)
	}
}

func TestAddDuplicateGroup(t *testing.T) {
	svc := newTestService(t)
	_ = svc.Add("backend")

	err := svc.Add("backend")
	if err == nil {
		t.Fatal("expected error for duplicate group")
	}
}

func TestRemoveGroup(t *testing.T) {
	svc := newTestService(t)
	_ = svc.Add("backend")
	_ = svc.Add("frontend")

	err := svc.Remove("backend")
	if err != nil {
		t.Fatalf("remove error: %v", err)
	}

	groups, _ := svc.List()
	if len(groups) != 1 || groups[0] != "frontend" {
		t.Fatalf("expected [frontend], got %v", groups)
	}
}

func TestRemoveNonexistentGroup(t *testing.T) {
	svc := newTestService(t)

	err := svc.Remove("nope")
	if err == nil {
		t.Fatal("expected error for nonexistent group")
	}
}
