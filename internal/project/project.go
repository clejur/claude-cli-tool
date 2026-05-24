package project

import (
	"fmt"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/clejur/claude-launcher/internal/config"
	"github.com/clejur/claude-launcher/internal/model"
)

type Service struct {
	store *config.Store
}

type EditOptions struct {
	Label   *string
	Path    *string
	Command *string
	Group   *string
}

func NewService(store *config.Store) *Service {
	return &Service{store: store}
}

func (s *Service) Add(name, label, path, command, group string) (*model.Project, error) {
	cfg, err := s.store.Load()
	if err != nil {
		return nil, err
	}

	for _, p := range cfg.Projects {
		if p.Name == name {
			return nil, fmt.Errorf("ERR_NAME_EXISTS|%s", name)
		}
		if strings.EqualFold(filepath.Clean(p.Path), filepath.Clean(path)) {
			return nil, fmt.Errorf("ERR_PATH_EXISTS|%s|%s", path, p.Name)
		}
	}

	project := model.Project{
		ID:        uuid.New().String(),
		Name:      name,
		Label:     label,
		Path:      path,
		Command:   command,
		Group:     group,
		CreatedAt: time.Now(),
	}

	cfg.Projects = append(cfg.Projects, project)
	if err := s.store.Save(cfg); err != nil {
		return nil, err
	}
	return &project, nil
}

func (s *Service) List(group string) ([]model.Project, error) {
	cfg, err := s.store.Load()
	if err != nil {
		return nil, err
	}

	if group == "" {
		return cfg.Projects, nil
	}

	var filtered []model.Project
	for _, p := range cfg.Projects {
		if p.Group == group {
			filtered = append(filtered, p)
		}
	}
	return filtered, nil
}

func (s *Service) Find(nameOrID string) (*model.Project, error) {
	cfg, err := s.store.Load()
	if err != nil {
		return nil, err
	}

	for i := range cfg.Projects {
		if cfg.Projects[i].Name == nameOrID || cfg.Projects[i].ID == nameOrID {
			return &cfg.Projects[i], nil
		}
	}
	return nil, fmt.Errorf("project %q not found", nameOrID)
}

func (s *Service) Remove(nameOrID string) error {
	cfg, err := s.store.Load()
	if err != nil {
		return err
	}

	idx := -1
	for i := range cfg.Projects {
		if cfg.Projects[i].Name == nameOrID || cfg.Projects[i].ID == nameOrID {
			idx = i
			break
		}
	}
	if idx == -1 {
		return fmt.Errorf("project %q not found", nameOrID)
	}

	cfg.Projects = append(cfg.Projects[:idx], cfg.Projects[idx+1:]...)
	return s.store.Save(cfg)
}

func (s *Service) Edit(nameOrID string, opts *EditOptions) (*model.Project, error) {
	cfg, err := s.store.Load()
	if err != nil {
		return nil, err
	}

	idx := -1
	for i := range cfg.Projects {
		if cfg.Projects[i].Name == nameOrID || cfg.Projects[i].ID == nameOrID {
			idx = i
			break
		}
	}
	if idx == -1 {
		return nil, fmt.Errorf("project %q not found", nameOrID)
	}

	p := &cfg.Projects[idx]
	if opts.Label != nil {
		p.Label = *opts.Label
	}
	if opts.Path != nil {
		p.Path = *opts.Path
	}
	if opts.Command != nil {
		p.Command = *opts.Command
	}
	if opts.Group != nil {
		p.Group = *opts.Group
	}

	if err := s.store.Save(cfg); err != nil {
		return nil, err
	}
	return p, nil
}
