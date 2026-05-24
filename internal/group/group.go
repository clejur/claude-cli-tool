package group

import (
	"fmt"

	"github.com/clejur/claude-launcher/internal/config"
)

type Service struct {
	store *config.Store
}

func NewService(store *config.Store) *Service {
	return &Service{store: store}
}

func (s *Service) Add(name string) error {
	cfg, err := s.store.Load()
	if err != nil {
		return err
	}

	for _, g := range cfg.Groups {
		if g == name {
			return fmt.Errorf("group %q already exists", name)
		}
	}

	cfg.Groups = append(cfg.Groups, name)
	return s.store.Save(cfg)
}

func (s *Service) List() ([]string, error) {
	cfg, err := s.store.Load()
	if err != nil {
		return nil, err
	}
	return cfg.Groups, nil
}

func (s *Service) Remove(name string) error {
	cfg, err := s.store.Load()
	if err != nil {
		return err
	}

	idx := -1
	for i, g := range cfg.Groups {
		if g == name {
			idx = i
			break
		}
	}
	if idx == -1 {
		return fmt.Errorf("group %q not found", name)
	}

	cfg.Groups = append(cfg.Groups[:idx], cfg.Groups[idx+1:]...)
	return s.store.Save(cfg)
}
