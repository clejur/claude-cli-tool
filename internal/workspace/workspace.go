package workspace

import (
	"fmt"

	"github.com/google/uuid"

	"github.com/clejur/claude-cli-tool/internal/config"
	"github.com/clejur/claude-cli-tool/internal/model"
)

type Service struct {
	store *config.Store
}

func NewService(store *config.Store) *Service {
	return &Service{store: store}
}

func (s *Service) Save(name string, projectNames []string) (*model.Workspace, error) {
	cfg, err := s.store.Load()
	if err != nil {
		return nil, err
	}

	for _, ws := range cfg.Workspaces {
		if ws.Name == name {
			return nil, fmt.Errorf("workspace %q already exists", name)
		}
	}

	var projectIDs []string
	for _, pName := range projectNames {
		found := false
		for _, p := range cfg.Projects {
			if p.Label == pName || p.ID == pName {
				projectIDs = append(projectIDs, p.ID)
				found = true
				break
			}
		}
		if !found {
			return nil, fmt.Errorf("project %q not found", pName)
		}
	}

	ws := model.Workspace{
		ID:         uuid.New().String(),
		Name:       name,
		ProjectIDs: projectIDs,
	}

	cfg.Workspaces = append(cfg.Workspaces, ws)
	if err := s.store.Save(cfg); err != nil {
		return nil, err
	}
	return &ws, nil
}

func (s *Service) List() ([]model.Workspace, error) {
	cfg, err := s.store.Load()
	if err != nil {
		return nil, err
	}
	return cfg.Workspaces, nil
}

func (s *Service) Resolve(name string) ([]model.Project, error) {
	cfg, err := s.store.Load()
	if err != nil {
		return nil, err
	}

	var ws *model.Workspace
	for i := range cfg.Workspaces {
		if cfg.Workspaces[i].Name == name {
			ws = &cfg.Workspaces[i]
			break
		}
	}
	if ws == nil {
		return nil, fmt.Errorf("workspace %q not found", name)
	}

	var projects []model.Project
	for _, id := range ws.ProjectIDs {
		for _, p := range cfg.Projects {
			if p.ID == id {
				projects = append(projects, p)
				break
			}
		}
	}
	return projects, nil
}

func (s *Service) Update(name string, projectNames []string) (*model.Workspace, error) {
	cfg, err := s.store.Load()
	if err != nil {
		return nil, err
	}

	var ws *model.Workspace
	for i := range cfg.Workspaces {
		if cfg.Workspaces[i].Name == name {
			ws = &cfg.Workspaces[i]
			break
		}
	}
	if ws == nil {
		return nil, fmt.Errorf("workspace %q not found", name)
	}

	var projectIDs []string
	for _, pName := range projectNames {
		found := false
		for _, p := range cfg.Projects {
			if p.Label == pName || p.ID == pName {
				projectIDs = append(projectIDs, p.ID)
				found = true
				break
			}
		}
		if !found {
			return nil, fmt.Errorf("project %q not found", pName)
		}
	}

	ws.ProjectIDs = projectIDs
	if err := s.store.Save(cfg); err != nil {
		return nil, err
	}
	return ws, nil
}

func (s *Service) Remove(name string) error {
	cfg, err := s.store.Load()
	if err != nil {
		return err
	}

	idx := -1
	for i := range cfg.Workspaces {
		if cfg.Workspaces[i].Name == name {
			idx = i
			break
		}
	}
	if idx == -1 {
		return fmt.Errorf("workspace %q not found", name)
	}

	cfg.Workspaces = append(cfg.Workspaces[:idx], cfg.Workspaces[idx+1:]...)
	return s.store.Save(cfg)
}
