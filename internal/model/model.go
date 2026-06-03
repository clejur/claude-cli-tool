package model

import "time"

type Project struct {
	ID        string    `json:"id"`
	Label     string    `json:"label"`
	Path      string    `json:"path"`
	Command   string    `json:"command"`
	Group     string    `json:"group"`
	CreatedAt time.Time `json:"createdAt"`
}

type Workspace struct {
	ID         string   `json:"id"`
	Name       string   `json:"name"`
	ProjectIDs []string `json:"projectIds"`
}

type Settings struct {
	CloseToTray      bool   `json:"closeToTray"`
	Hotkey           string `json:"hotkey"`
	ScanAllTerminals bool   `json:"scanAllTerminals"`
}

type Config struct {
	Projects   []Project   `json:"projects"`
	Groups     []string    `json:"groups"`
	Workspaces []Workspace `json:"workspaces"`
	Settings   Settings    `json:"settings"`
}
