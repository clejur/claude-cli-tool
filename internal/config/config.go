package config

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"

	"github.com/clejur/claude-launcher/internal/model"
)

type Store struct {
	path string
}

func NewStore(path string) *Store {
	return &Store{path: path}
}

func DefaultPath() string {
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".claude-cli-launcher", "config.json")
}

func (s *Store) Load() (*model.Config, error) {
	data, err := os.ReadFile(s.path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return &model.Config{
				Projects:   []model.Project{},
				Groups:     []string{},
				Workspaces: []model.Workspace{},
				Settings:   model.Settings{CloseToTray: true, Hotkey: "Ctrl+Shift+C"},
			}, nil
		}
		return nil, err
	}

	var cfg model.Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}
	return &cfg, nil
}

func (s *Store) Save(cfg *model.Config) error {
	dir := filepath.Dir(s.path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.path, data, 0644)
}
