package config

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/clejur/claude-cli-tool/internal/model"
)

func TestLoadCreatesDefaultIfMissing(t *testing.T) {
	dir := t.TempDir()
	s := NewStore(filepath.Join(dir, "config.json"))

	cfg, err := s.Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg == nil {
		t.Fatal("expected non-nil config")
	}
	if len(cfg.Projects) != 0 {
		t.Fatalf("expected empty projects, got %d", len(cfg.Projects))
	}
}

func TestSaveAndLoad(t *testing.T) {
	dir := t.TempDir()
	s := NewStore(filepath.Join(dir, "config.json"))

	cfg := &model.Config{
		Projects: []model.Project{
			{ID: "test-id", Label: "test-proj", Path: "D:\\test"},
		},
		Groups:     []string{"backend"},
		Workspaces: []model.Workspace{},
	}

	if err := s.Save(cfg); err != nil {
		t.Fatalf("save error: %v", err)
	}

	loaded, err := s.Load()
	if err != nil {
		t.Fatalf("load error: %v", err)
	}
	if len(loaded.Projects) != 1 {
		t.Fatalf("expected 1 project, got %d", len(loaded.Projects))
	}
	if loaded.Projects[0].Label != "test-proj" {
		t.Fatalf("expected label test-proj, got %s", loaded.Projects[0].Label)
	}
}

func TestLoadReadsExistingFile(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "config.json")

	data := []byte(`{"projects":[],"groups":["g1"],"workspaces":[]}`)
	if err := os.WriteFile(path, data, 0644); err != nil {
		t.Fatal(err)
	}

	s := NewStore(path)
	cfg, err := s.Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(cfg.Groups) != 1 || cfg.Groups[0] != "g1" {
		t.Fatalf("expected groups [g1], got %v", cfg.Groups)
	}
}
