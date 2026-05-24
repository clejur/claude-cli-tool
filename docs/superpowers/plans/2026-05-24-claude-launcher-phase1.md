# Claude Launcher Phase 1 (CLI) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Go CLI tool (`cl`) that manages Claude Code terminal session configurations and launches them in Windows Terminal tabs.

**Architecture:** Cobra-based CLI with a JSON config store at `~/.claude-launcher/config.json`. Core logic lives in `internal/` packages (config, project, group, workspace, launcher, status). CLI commands in `cmd/cl/` delegate to these packages.

**Tech Stack:** Go 1.22+, cobra (CLI), google/uuid (IDs), encoding/json (storage), os/exec (launching wt), mitchellh/go-ps or shirou/gopsutil (process scanning)

---

## File Structure

| File | Responsibility |
|------|----------------|
| `go.mod` | Module definition and dependencies |
| `cmd/cl/main.go` | CLI entry point, root command registration |
| `cmd/cl/add.go` | `cl add` command |
| `cmd/cl/list.go` | `cl list` command |
| `cmd/cl/edit.go` | `cl edit` command |
| `cmd/cl/remove.go` | `cl remove` command |
| `cmd/cl/start.go` | `cl start` command |
| `cmd/cl/status.go` | `cl status` command |
| `cmd/cl/group.go` | `cl group` subcommands |
| `cmd/cl/workspace.go` | `cl workspace` subcommands |
| `internal/config/config.go` | Config file read/write, path resolution |
| `internal/config/config_test.go` | Config tests |
| `internal/project/project.go` | Project CRUD operations |
| `internal/project/project_test.go` | Project tests |
| `internal/group/group.go` | Group management logic |
| `internal/group/group_test.go` | Group tests |
| `internal/workspace/workspace.go` | Workspace save/restore logic |
| `internal/workspace/workspace_test.go` | Workspace tests |
| `internal/launcher/launcher.go` | Windows Terminal launch logic |
| `internal/launcher/launcher_test.go` | Launcher tests |
| `internal/status/status.go` | Process scanning and status detection |
| `internal/status/status_test.go` | Status tests |
| `internal/model/model.go` | Shared data types (Project, Workspace, Config) |

---

### Task 1: Project Scaffolding and Data Model

**Files:**
- Create: `go.mod`
- Create: `internal/model/model.go`
- Create: `cmd/cl/main.go`

- [ ] **Step 1: Initialize Go module**

Run:
```bash
cd D:\test\claude-cli-tool
go mod init github.com/clejur/claude-launcher
```

Expected: `go.mod` created with module path.

- [ ] **Step 2: Install dependencies**

Run:
```bash
go get github.com/spf13/cobra@latest
go get github.com/google/uuid@latest
```

Expected: Dependencies added to `go.mod` and `go.sum` created.

- [ ] **Step 3: Create data model**

Create `internal/model/model.go`:

```go
package model

import "time"

type Project struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
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

type Config struct {
	Projects   []Project   `json:"projects"`
	Groups     []string    `json:"groups"`
	Workspaces []Workspace `json:"workspaces"`
}
```

- [ ] **Step 4: Create CLI entry point**

Create `cmd/cl/main.go`:

```go
package main

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "cl",
	Short: "Claude Launcher - manage and launch Claude Code terminal sessions",
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
```

- [ ] **Step 5: Verify it builds**

Run:
```bash
go build ./cmd/cl/
```

Expected: Builds without errors, produces `cl.exe`.

- [ ] **Step 6: Commit**

```bash
git init
git add go.mod go.sum internal/model/model.go cmd/cl/main.go
git commit -m "feat: scaffold project with data model and CLI entry point"
```

---

### Task 2: Config Package (Read/Write JSON)

**Files:**
- Create: `internal/config/config.go`
- Create: `internal/config/config_test.go`

- [ ] **Step 1: Write the failing test**

Create `internal/config/config_test.go`:

```go
package config

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/clejur/claude-launcher/internal/model"
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
			{ID: "test-id", Name: "test-proj", Path: "D:\\test"},
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
	if loaded.Projects[0].Name != "test-proj" {
		t.Fatalf("expected name test-proj, got %s", loaded.Projects[0].Name)
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
go test ./internal/config/ -v
```

Expected: FAIL — `NewStore` not defined.

- [ ] **Step 3: Implement config package**

Create `internal/config/config.go`:

```go
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
	return filepath.Join(home, ".claude-launcher", "config.json")
}

func (s *Store) Load() (*model.Config, error) {
	data, err := os.ReadFile(s.path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return &model.Config{
				Projects:   []model.Project{},
				Groups:     []string{},
				Workspaces: []model.Workspace{},
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
go test ./internal/config/ -v
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/config/
git commit -m "feat: add config package for JSON read/write"
```

---

### Task 3: Project CRUD Package

**Files:**
- Create: `internal/project/project.go`
- Create: `internal/project/project_test.go`

- [ ] **Step 1: Write the failing tests**

Create `internal/project/project_test.go`:

```go
package project

import (
	"path/filepath"
	"testing"

	"github.com/clejur/claude-launcher/internal/config"
	"github.com/clejur/claude-launcher/internal/model"
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
go test ./internal/project/ -v
```

Expected: FAIL — `NewService`, `Service` not defined.

- [ ] **Step 3: Implement project package**

Create `internal/project/project.go`:

```go
package project

import (
	"fmt"
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
			return nil, fmt.Errorf("project with name %q already exists", name)
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
go test ./internal/project/ -v
```

Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/project/
git commit -m "feat: add project CRUD package"
```

---

### Task 4: Group Management Package

**Files:**
- Create: `internal/group/group.go`
- Create: `internal/group/group_test.go`

- [ ] **Step 1: Write the failing tests**

Create `internal/group/group_test.go`:

```go
package group

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
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
go test ./internal/group/ -v
```

Expected: FAIL — `NewService` not defined.

- [ ] **Step 3: Implement group package**

Create `internal/group/group.go`:

```go
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
go test ./internal/group/ -v
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/group/
git commit -m "feat: add group management package"
```

---

### Task 5: Launcher Package (Windows Terminal Integration)

**Files:**
- Create: `internal/launcher/launcher.go`
- Create: `internal/launcher/launcher_test.go`

- [ ] **Step 1: Write the failing tests**

Create `internal/launcher/launcher_test.go`:

```go
package launcher

import (
	"testing"

	"github.com/clejur/claude-launcher/internal/model"
)

func TestBuildSingleCommand(t *testing.T) {
	l := New()
	p := model.Project{
		Label:   "API Server",
		Path:    `D:\projects\api`,
		Command: "claude",
	}

	args := l.BuildArgs([]model.Project{p})
	expected := []string{
		"new-tab",
		"--title", "API Server",
		"--startingDirectory", `D:\projects\api`,
		"powershell", "-NoExit", "-Command", "claude",
	}

	if len(args) != len(expected) {
		t.Fatalf("expected %d args, got %d: %v", len(expected), len(args), args)
	}
	for i := range expected {
		if args[i] != expected[i] {
			t.Fatalf("arg[%d]: expected %q, got %q", i, expected[i], args[i])
		}
	}
}

func TestBuildMultipleCommands(t *testing.T) {
	l := New()
	projects := []model.Project{
		{Label: "API", Path: `D:\api`, Command: "claude"},
		{Label: "Web", Path: `D:\web`, Command: "claude --resume"},
	}

	args := l.BuildArgs(projects)

	// Should contain a semicolon separator between the two tab commands
	hasSemicolon := false
	for _, a := range args {
		if a == ";" {
			hasSemicolon = true
			break
		}
	}
	if !hasSemicolon {
		t.Fatalf("expected semicolon separator in args: %v", args)
	}
}

func TestBuildArgsEmptyProjects(t *testing.T) {
	l := New()
	args := l.BuildArgs([]model.Project{})
	if len(args) != 0 {
		t.Fatalf("expected empty args for empty projects, got %v", args)
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
go test ./internal/launcher/ -v
```

Expected: FAIL — `New` not defined.

- [ ] **Step 3: Implement launcher package**

Create `internal/launcher/launcher.go`:

```go
package launcher

import (
	"fmt"
	"os/exec"

	"github.com/clejur/claude-launcher/internal/model"
)

type Launcher struct{}

func New() *Launcher {
	return &Launcher{}
}

func (l *Launcher) BuildArgs(projects []model.Project) []string {
	if len(projects) == 0 {
		return nil
	}

	var args []string
	for i, p := range projects {
		if i > 0 {
			args = append(args, ";")
		}
		args = append(args,
			"new-tab",
			"--title", p.Label,
			"--startingDirectory", p.Path,
			"powershell", "-NoExit", "-Command", p.Command,
		)
	}
	return args
}

func (l *Launcher) Launch(projects []model.Project) error {
	if len(projects) == 0 {
		return fmt.Errorf("no projects to launch")
	}

	args := l.BuildArgs(projects)
	cmd := exec.Command("wt", args...)
	return cmd.Start()
}

func (l *Launcher) CheckWTAvailable() error {
	_, err := exec.LookPath("wt")
	if err != nil {
		return fmt.Errorf("Windows Terminal (wt) not found in PATH. Please install Windows Terminal")
	}
	return nil
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
go test ./internal/launcher/ -v
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/launcher/
git commit -m "feat: add launcher package for Windows Terminal integration"
```

---

### Task 6: Status Detection Package

**Files:**
- Create: `internal/status/status.go`
- Create: `internal/status/status_test.go`

- [ ] **Step 1: Install process scanning dependency**

Run:
```bash
go get github.com/shirou/gopsutil/v3/process@latest
```

- [ ] **Step 2: Write the failing tests**

Create `internal/status/status_test.go`:

```go
package status

import (
	"testing"

	"github.com/clejur/claude-launcher/internal/model"
)

func TestMatchProjectsToProcesses(t *testing.T) {
	projects := []model.Project{
		{ID: "1", Name: "api", Path: `D:\projects\api`},
		{ID: "2", Name: "web", Path: `D:\projects\web`},
	}

	// Simulate processes: one matches, one doesn't
	processes := []ProcessInfo{
		{PID: 1234, Exe: "claude.exe", Cwd: `D:\projects\api`},
		{PID: 5678, Exe: "node.exe", Cwd: `D:\other`},
	}

	results := MatchProjects(projects, processes)

	if len(results) != 2 {
		t.Fatalf("expected 2 results, got %d", len(results))
	}

	if results[0].Running != true || results[0].PID != 1234 {
		t.Fatalf("expected api running with PID 1234, got running=%v pid=%d", results[0].Running, results[0].PID)
	}
	if results[1].Running != false {
		t.Fatalf("expected web not running, got running=%v", results[1].Running)
	}
}

func TestNormalizePathComparison(t *testing.T) {
	tests := []struct {
		a, b string
		want bool
	}{
		{`D:\projects\api`, `D:\projects\api`, true},
		{`D:\projects\api\`, `D:\projects\api`, true},
		{`d:\projects\api`, `D:\Projects\API`, true},
		{`D:\projects\api`, `D:\projects\web`, false},
	}

	for _, tt := range tests {
		got := pathsEqual(tt.a, tt.b)
		if got != tt.want {
			t.Errorf("pathsEqual(%q, %q) = %v, want %v", tt.a, tt.b, got, tt.want)
		}
	}
}
```

- [ ] **Step 3: Run tests to verify they fail**

Run:
```bash
go test ./internal/status/ -v
```

Expected: FAIL — `ProcessInfo`, `MatchProjects`, `pathsEqual` not defined.

- [ ] **Step 4: Implement status package**

Create `internal/status/status.go`:

```go
package status

import (
	"path/filepath"
	"strings"

	"github.com/shirou/gopsutil/v3/process"

	"github.com/clejur/claude-launcher/internal/model"
)

type ProcessInfo struct {
	PID int32
	Exe string
	Cwd string
}

type ProjectStatus struct {
	Project model.Project
	Running bool
	PID     int32
}

func MatchProjects(projects []model.Project, processes []ProcessInfo) []ProjectStatus {
	results := make([]ProjectStatus, len(projects))

	for i, proj := range projects {
		results[i] = ProjectStatus{Project: proj, Running: false}
		for _, proc := range processes {
			if isClaudeProcess(proc.Exe) && pathsEqual(proc.Cwd, proj.Path) {
				results[i].Running = true
				results[i].PID = proc.PID
				break
			}
		}
	}
	return results
}

func ScanProcesses() ([]ProcessInfo, error) {
	procs, err := process.Processes()
	if err != nil {
		return nil, err
	}

	var infos []ProcessInfo
	for _, p := range procs {
		name, err := p.Name()
		if err != nil {
			continue
		}
		if !isClaudeProcess(name) {
			continue
		}
		cwd, err := p.Cwd()
		if err != nil {
			continue
		}
		infos = append(infos, ProcessInfo{
			PID: p.Pid,
			Exe: name,
			Cwd: cwd,
		})
	}
	return infos, nil
}

func isClaudeProcess(name string) bool {
	lower := strings.ToLower(name)
	return lower == "claude" || lower == "claude.exe"
}

func pathsEqual(a, b string) bool {
	a = filepath.Clean(a)
	b = filepath.Clean(b)
	return strings.EqualFold(a, b)
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run:
```bash
go test ./internal/status/ -v
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add internal/status/
git commit -m "feat: add status detection package for Claude process scanning"
```

---

### Task 7: Workspace Package

**Files:**
- Create: `internal/workspace/workspace.go`
- Create: `internal/workspace/workspace_test.go`

- [ ] **Step 1: Write the failing tests**

Create `internal/workspace/workspace_test.go`:

```go
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
			{ID: "id1", Name: "api"},
			{ID: "id2", Name: "web"},
			{ID: "id3", Name: "tool"},
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
go test ./internal/workspace/ -v
```

Expected: FAIL — `NewService` not defined.

- [ ] **Step 3: Implement workspace package**

Create `internal/workspace/workspace.go`:

```go
package workspace

import (
	"fmt"

	"github.com/google/uuid"

	"github.com/clejur/claude-launcher/internal/config"
	"github.com/clejur/claude-launcher/internal/model"
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
			if p.Name == pName || p.ID == pName {
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
go test ./internal/workspace/ -v
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/workspace/
git commit -m "feat: add workspace management package"
```

---

### Task 8: CLI Commands - Add and List

**Files:**
- Create: `cmd/cl/add.go`
- Create: `cmd/cl/list.go`
- Modify: `cmd/cl/main.go`

- [ ] **Step 1: Update main.go to initialize services**

Replace `cmd/cl/main.go` with:

```go
package main

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"

	"github.com/clejur/claude-launcher/internal/config"
	"github.com/clejur/claude-launcher/internal/group"
	"github.com/clejur/claude-launcher/internal/launcher"
	"github.com/clejur/claude-launcher/internal/project"
	"github.com/clejur/claude-launcher/internal/workspace"
)

var (
	store       *config.Store
	projectSvc  *project.Service
	groupSvc    *group.Service
	workspaceSvc *workspace.Service
	launcherSvc *launcher.Launcher
)

var rootCmd = &cobra.Command{
	Use:   "cl",
	Short: "Claude Launcher - manage and launch Claude Code terminal sessions",
}

func init() {
	store = config.NewStore(config.DefaultPath())
	projectSvc = project.NewService(store)
	groupSvc = group.NewService(store)
	workspaceSvc = workspace.NewService(store)
	launcherSvc = launcher.New()
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
```

- [ ] **Step 2: Create add command**

Create `cmd/cl/add.go`:

```go
package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"github.com/spf13/cobra"
)

var addCmd = &cobra.Command{
	Use:   "add",
	Short: "Add a new project",
	RunE: func(cmd *cobra.Command, args []string) error {
		name, _ := cmd.Flags().GetString("name")
		label, _ := cmd.Flags().GetString("label")
		path, _ := cmd.Flags().GetString("path")
		command, _ := cmd.Flags().GetString("command")
		group, _ := cmd.Flags().GetString("group")

		if name == "" || path == "" {
			return addInteractive()
		}

		if label == "" {
			label = name
		}
		if command == "" {
			command = "claude"
		}

		p, err := projectSvc.Add(name, label, path, command, group)
		if err != nil {
			return err
		}
		fmt.Printf("Added project %q (id: %s)\n", p.Name, p.ID)
		return nil
	},
}

func addInteractive() error {
	reader := bufio.NewReader(os.Stdin)

	fmt.Print("Project name: ")
	name, _ := reader.ReadString('\n')
	name = strings.TrimSpace(name)

	fmt.Print("Project path: ")
	path, _ := reader.ReadString('\n')
	path = strings.TrimSpace(path)

	fmt.Print("Tab label (default: same as name): ")
	label, _ := reader.ReadString('\n')
	label = strings.TrimSpace(label)
	if label == "" {
		label = name
	}

	fmt.Print("Command (default: claude): ")
	command, _ := reader.ReadString('\n')
	command = strings.TrimSpace(command)
	if command == "" {
		command = "claude"
	}

	fmt.Print("Group (optional): ")
	group, _ := reader.ReadString('\n')
	group = strings.TrimSpace(group)

	p, err := projectSvc.Add(name, label, path, command, group)
	if err != nil {
		return err
	}
	fmt.Printf("Added project %q (id: %s)\n", p.Name, p.ID)
	return nil
}

func init() {
	addCmd.Flags().StringP("name", "n", "", "Project name")
	addCmd.Flags().StringP("path", "p", "", "Project directory path")
	addCmd.Flags().StringP("label", "l", "", "Tab label (default: same as name)")
	addCmd.Flags().StringP("command", "c", "", "Launch command (default: claude)")
	addCmd.Flags().StringP("group", "g", "", "Project group")
	rootCmd.AddCommand(addCmd)
}
```

- [ ] **Step 3: Create list command**

Create `cmd/cl/list.go`:

```go
package main

import (
	"fmt"
	"os"
	"text/tabwriter"

	"github.com/spf13/cobra"
)

var listCmd = &cobra.Command{
	Use:   "list",
	Short: "List all projects",
	RunE: func(cmd *cobra.Command, args []string) error {
		groupFilter, _ := cmd.Flags().GetString("group")

		projects, err := projectSvc.List(groupFilter)
		if err != nil {
			return err
		}

		if len(projects) == 0 {
			fmt.Println("No projects found.")
			return nil
		}

		w := tabwriter.NewWriter(os.Stdout, 0, 0, 2, ' ', 0)
		fmt.Fprintln(w, "NAME\tLABEL\tPATH\tGROUP\tCOMMAND")
		for _, p := range projects {
			fmt.Fprintf(w, "%s\t%s\t%s\t%s\t%s\n", p.Name, p.Label, p.Path, p.Group, p.Command)
		}
		w.Flush()
		return nil
	},
}

func init() {
	listCmd.Flags().StringP("group", "g", "", "Filter by group")
	rootCmd.AddCommand(listCmd)
}
```

- [ ] **Step 4: Build and verify**

Run:
```bash
go build ./cmd/cl/ && .\cl.exe list
```

Expected: Builds successfully. Output: "No projects found."

- [ ] **Step 5: Commit**

```bash
git add cmd/cl/
git commit -m "feat: add CLI add and list commands"
```

---

### Task 9: CLI Commands - Edit, Remove, Start

**Files:**
- Create: `cmd/cl/edit.go`
- Create: `cmd/cl/remove.go`
- Create: `cmd/cl/start.go`

- [ ] **Step 1: Create edit command**

Create `cmd/cl/edit.go`:

```go
package main

import (
	"fmt"

	"github.com/clejur/claude-launcher/internal/project"
	"github.com/spf13/cobra"
)

var editCmd = &cobra.Command{
	Use:   "edit <name|id>",
	Short: "Edit a project's configuration",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		nameOrID := args[0]

		opts := &project.EditOptions{}
		hasChange := false

		if cmd.Flags().Changed("label") {
			v, _ := cmd.Flags().GetString("label")
			opts.Label = &v
			hasChange = true
		}
		if cmd.Flags().Changed("path") {
			v, _ := cmd.Flags().GetString("path")
			opts.Path = &v
			hasChange = true
		}
		if cmd.Flags().Changed("command") {
			v, _ := cmd.Flags().GetString("command")
			opts.Command = &v
			hasChange = true
		}
		if cmd.Flags().Changed("group") {
			v, _ := cmd.Flags().GetString("group")
			opts.Group = &v
			hasChange = true
		}

		if !hasChange {
			return fmt.Errorf("no changes specified. Use flags: --label, --path, --command, --group")
		}

		p, err := projectSvc.Edit(nameOrID, opts)
		if err != nil {
			return err
		}
		fmt.Printf("Updated project %q\n", p.Name)
		return nil
	},
}

func init() {
	editCmd.Flags().StringP("label", "l", "", "New tab label")
	editCmd.Flags().StringP("path", "p", "", "New project path")
	editCmd.Flags().StringP("command", "c", "", "New launch command")
	editCmd.Flags().StringP("group", "g", "", "New group")
	rootCmd.AddCommand(editCmd)
}
```

- [ ] **Step 2: Create remove command**

Create `cmd/cl/remove.go`:

```go
package main

import (
	"fmt"

	"github.com/spf13/cobra"
)

var removeCmd = &cobra.Command{
	Use:   "remove <name|id>",
	Short: "Remove a project",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		nameOrID := args[0]

		err := projectSvc.Remove(nameOrID)
		if err != nil {
			return err
		}
		fmt.Printf("Removed project %q\n", nameOrID)
		return nil
	},
}

func init() {
	rootCmd.AddCommand(removeCmd)
}
```

- [ ] **Step 3: Create start command**

Create `cmd/cl/start.go`:

```go
package main

import (
	"fmt"

	"github.com/spf13/cobra"
)

var startCmd = &cobra.Command{
	Use:   "start [name|id]",
	Short: "Start a project in a new Windows Terminal tab",
	RunE: func(cmd *cobra.Command, args []string) error {
		if err := launcherSvc.CheckWTAvailable(); err != nil {
			return err
		}

		all, _ := cmd.Flags().GetBool("all")
		groupFilter, _ := cmd.Flags().GetString("group")

		if all {
			projects, err := projectSvc.List("")
			if err != nil {
				return err
			}
			if len(projects) == 0 {
				return fmt.Errorf("no projects configured")
			}
			fmt.Printf("Starting %d projects...\n", len(projects))
			return launcherSvc.Launch(projects)
		}

		if groupFilter != "" {
			projects, err := projectSvc.List(groupFilter)
			if err != nil {
				return err
			}
			if len(projects) == 0 {
				return fmt.Errorf("no projects in group %q", groupFilter)
			}
			fmt.Printf("Starting %d projects in group %q...\n", len(projects), groupFilter)
			return launcherSvc.Launch(projects)
		}

		if len(args) == 0 {
			return fmt.Errorf("specify a project name/id, --all, or --group")
		}

		p, err := projectSvc.Find(args[0])
		if err != nil {
			return err
		}

		fmt.Printf("Starting %q...\n", p.Name)
		return launcherSvc.Launch([]model.Project{*p})
	},
}

func init() {
	startCmd.Flags().BoolP("all", "a", false, "Start all projects")
	startCmd.Flags().StringP("group", "g", "", "Start all projects in a group")
	rootCmd.AddCommand(startCmd)
}
```

- [ ] **Step 4: Add model import to start.go**

Add the import at the top of `cmd/cl/start.go`:

```go
import (
	"fmt"

	"github.com/clejur/claude-launcher/internal/model"
	"github.com/spf13/cobra"
)
```

- [ ] **Step 5: Build and verify**

Run:
```bash
go build ./cmd/cl/
```

Expected: Builds without errors.

- [ ] **Step 6: Commit**

```bash
git add cmd/cl/edit.go cmd/cl/remove.go cmd/cl/start.go
git commit -m "feat: add CLI edit, remove, and start commands"
```

---

### Task 10: CLI Commands - Group and Workspace

**Files:**
- Create: `cmd/cl/group.go`
- Create: `cmd/cl/workspace.go`

- [ ] **Step 1: Create group command**

Create `cmd/cl/group.go`:

```go
package main

import (
	"fmt"

	"github.com/spf13/cobra"
)

var groupCmd = &cobra.Command{
	Use:   "group",
	Short: "Manage project groups",
}

var groupAddCmd = &cobra.Command{
	Use:   "add <name>",
	Short: "Add a new group",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		err := groupSvc.Add(args[0])
		if err != nil {
			return err
		}
		fmt.Printf("Added group %q\n", args[0])
		return nil
	},
}

var groupListCmd = &cobra.Command{
	Use:   "list",
	Short: "List all groups",
	RunE: func(cmd *cobra.Command, args []string) error {
		groups, err := groupSvc.List()
		if err != nil {
			return err
		}
		if len(groups) == 0 {
			fmt.Println("No groups found.")
			return nil
		}
		for _, g := range groups {
			fmt.Println(g)
		}
		return nil
	},
}

var groupRemoveCmd = &cobra.Command{
	Use:   "remove <name>",
	Short: "Remove a group",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		err := groupSvc.Remove(args[0])
		if err != nil {
			return err
		}
		fmt.Printf("Removed group %q\n", args[0])
		return nil
	},
}

func init() {
	groupCmd.AddCommand(groupAddCmd)
	groupCmd.AddCommand(groupListCmd)
	groupCmd.AddCommand(groupRemoveCmd)
	rootCmd.AddCommand(groupCmd)
}
```

- [ ] **Step 2: Create workspace command**

Create `cmd/cl/workspace.go`:

```go
package main

import (
	"fmt"
	"os"
	"text/tabwriter"

	"github.com/spf13/cobra"
)

var workspaceCmd = &cobra.Command{
	Use:   "workspace",
	Short: "Manage workspaces",
}

var workspaceSaveCmd = &cobra.Command{
	Use:   "save <name> [project-names...]",
	Short: "Save projects as a workspace",
	Args:  cobra.MinimumNArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		name := args[0]
		projectNames := args[1:]

		if len(projectNames) == 0 {
			return fmt.Errorf("specify at least one project name after the workspace name")
		}

		ws, err := workspaceSvc.Save(name, projectNames)
		if err != nil {
			return err
		}
		fmt.Printf("Saved workspace %q with %d projects\n", ws.Name, len(ws.ProjectIDs))
		return nil
	},
}

var workspaceListCmd = &cobra.Command{
	Use:   "list",
	Short: "List all workspaces",
	RunE: func(cmd *cobra.Command, args []string) error {
		workspaces, err := workspaceSvc.List()
		if err != nil {
			return err
		}
		if len(workspaces) == 0 {
			fmt.Println("No workspaces found.")
			return nil
		}

		w := tabwriter.NewWriter(os.Stdout, 0, 0, 2, ' ', 0)
		fmt.Fprintln(w, "NAME\tPROJECTS")
		for _, ws := range workspaces {
			fmt.Fprintf(w, "%s\t%d\n", ws.Name, len(ws.ProjectIDs))
		}
		w.Flush()
		return nil
	},
}

var workspaceRestoreCmd = &cobra.Command{
	Use:   "restore <name>",
	Short: "Restore a workspace (launch all its projects)",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		if err := launcherSvc.CheckWTAvailable(); err != nil {
			return err
		}

		projects, err := workspaceSvc.Resolve(args[0])
		if err != nil {
			return err
		}
		if len(projects) == 0 {
			return fmt.Errorf("workspace %q has no valid projects", args[0])
		}

		fmt.Printf("Restoring workspace %q (%d projects)...\n", args[0], len(projects))
		return launcherSvc.Launch(projects)
	},
}

var workspaceRemoveCmd = &cobra.Command{
	Use:   "remove <name>",
	Short: "Remove a workspace",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		err := workspaceSvc.Remove(args[0])
		if err != nil {
			return err
		}
		fmt.Printf("Removed workspace %q\n", args[0])
		return nil
	},
}

func init() {
	workspaceCmd.AddCommand(workspaceSaveCmd)
	workspaceCmd.AddCommand(workspaceListCmd)
	workspaceCmd.AddCommand(workspaceRestoreCmd)
	workspaceCmd.AddCommand(workspaceRemoveCmd)
	rootCmd.AddCommand(workspaceCmd)
}
```

- [ ] **Step 3: Build and verify**

Run:
```bash
go build ./cmd/cl/
```

Expected: Builds without errors.

- [ ] **Step 4: Commit**

```bash
git add cmd/cl/group.go cmd/cl/workspace.go
git commit -m "feat: add CLI group and workspace commands"
```

---

### Task 11: CLI Status Command

**Files:**
- Create: `cmd/cl/status.go`

- [ ] **Step 1: Create status command**

Create `cmd/cl/status.go`:

```go
package main

import (
	"fmt"
	"os"
	"text/tabwriter"

	"github.com/clejur/claude-launcher/internal/status"
	"github.com/spf13/cobra"
)

var statusCmd = &cobra.Command{
	Use:   "status [name|id]",
	Short: "Check Claude running status for projects",
	RunE: func(cmd *cobra.Command, args []string) error {
		groupFilter, _ := cmd.Flags().GetString("group")

		processes, err := status.ScanProcesses()
		if err != nil {
			return fmt.Errorf("failed to scan processes: %w", err)
		}

		if len(args) > 0 {
			p, err := projectSvc.Find(args[0])
			if err != nil {
				return err
			}
			results := status.MatchProjects([]model.Project{*p}, processes)
			printStatus(results)
			return nil
		}

		projects, err := projectSvc.List(groupFilter)
		if err != nil {
			return err
		}
		if len(projects) == 0 {
			fmt.Println("No projects found.")
			return nil
		}

		results := status.MatchProjects(projects, processes)
		printStatus(results)
		return nil
	},
}

func printStatus(results []status.ProjectStatus) {
	w := tabwriter.NewWriter(os.Stdout, 0, 0, 2, ' ', 0)
	fmt.Fprintln(w, "NAME\tGROUP\tSTATUS\tPID")
	for _, r := range results {
		statusStr := "stopped"
		pidStr := "-"
		if r.Running {
			statusStr = "running"
			pidStr = fmt.Sprintf("%d", r.PID)
		}
		fmt.Fprintf(w, "%s\t%s\t%s\t%s\n", r.Project.Name, r.Project.Group, statusStr, pidStr)
	}
	w.Flush()
}

func init() {
	statusCmd.Flags().StringP("group", "g", "", "Filter by group")
	rootCmd.AddCommand(statusCmd)
}
```

- [ ] **Step 2: Add model import to status.go**

Ensure the import block includes:

```go
import (
	"fmt"
	"os"
	"text/tabwriter"

	"github.com/clejur/claude-launcher/internal/model"
	"github.com/clejur/claude-launcher/internal/status"
	"github.com/spf13/cobra"
)
```

- [ ] **Step 3: Build and verify**

Run:
```bash
go build ./cmd/cl/
```

Expected: Builds without errors.

- [ ] **Step 4: Smoke test**

Run:
```bash
.\cl.exe status
```

Expected: Either "No projects found." or a table with status info.

- [ ] **Step 5: Commit**

```bash
git add cmd/cl/status.go
git commit -m "feat: add CLI status command for process detection"
```

---

### Task 12: End-to-End Integration Test

**Files:**
- Create: `cmd/cl/main_test.go`

- [ ] **Step 1: Write integration test**

Create `cmd/cl/main_test.go`:

```go
package main

import (
	"os"
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

	// Add group
	err := groupSvc.Add("backend")
	if err != nil {
		t.Fatalf("add group: %v", err)
	}

	// Add projects
	p1, err := projectSvc.Add("api", "API Server", `D:\projects\api`, "claude", "backend")
	if err != nil {
		t.Fatalf("add project: %v", err)
	}
	p2, err := projectSvc.Add("web", "Web App", `D:\projects\web`, "claude --resume", "backend")
	if err != nil {
		t.Fatalf("add project: %v", err)
	}

	// List projects
	projects, err := projectSvc.List("backend")
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(projects) != 2 {
		t.Fatalf("expected 2 projects, got %d", len(projects))
	}

	// Save workspace
	ws, err := workspaceSvc.Save("daily", []string{p1.Name, p2.Name})
	if err != nil {
		t.Fatalf("save workspace: %v", err)
	}
	if len(ws.ProjectIDs) != 2 {
		t.Fatalf("expected 2 IDs in workspace, got %d", len(ws.ProjectIDs))
	}

	// Resolve workspace
	resolved, err := workspaceSvc.Resolve("daily")
	if err != nil {
		t.Fatalf("resolve workspace: %v", err)
	}
	if len(resolved) != 2 {
		t.Fatalf("expected 2 resolved projects, got %d", len(resolved))
	}

	// Verify config file exists on disk
	cfg, err := store.Load()
	if err != nil {
		t.Fatalf("load config: %v", err)
	}
	if len(cfg.Projects) != 2 {
		t.Fatalf("config should have 2 projects, got %d", len(cfg.Projects))
	}

	// Remove project
	err = projectSvc.Remove("api")
	if err != nil {
		t.Fatalf("remove: %v", err)
	}
	projects, _ = projectSvc.List("")
	if len(projects) != 1 {
		t.Fatalf("expected 1 project after remove, got %d", len(projects))
	}

	// Suppress unused variable warnings
	_ = os.DevNull
	_ = filepath.Base("")
}
```

- [ ] **Step 2: Run the integration test**

Run:
```bash
go test ./cmd/cl/ -v -run TestFullWorkflow
```

Expected: PASS.

- [ ] **Step 3: Run all tests**

Run:
```bash
go test ./... -v
```

Expected: All tests across all packages PASS.

- [ ] **Step 4: Commit**

```bash
git add cmd/cl/main_test.go
git commit -m "test: add end-to-end integration test"
```

---

### Task 13: Build and Install

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Create .gitignore**

Create `.gitignore`:

```
cl.exe
*.exe
dist/
```

- [ ] **Step 2: Final build**

Run:
```bash
go build -o cl.exe ./cmd/cl/
```

Expected: Produces `cl.exe` in project root.

- [ ] **Step 3: Verify all commands work**

Run:
```bash
.\cl.exe --help
.\cl.exe add --help
.\cl.exe list
.\cl.exe group --help
.\cl.exe workspace --help
.\cl.exe status
.\cl.exe start --help
```

Expected: Each command prints its help text or expected output without errors.

- [ ] **Step 4: Install globally (optional)**

Run:
```bash
go install ./cmd/cl/
```

Expected: `cl.exe` installed to `$GOPATH/bin`, accessible globally.

- [ ] **Step 5: Commit**

```bash
git add .gitignore
git commit -m "chore: add gitignore and finalize build"
```
