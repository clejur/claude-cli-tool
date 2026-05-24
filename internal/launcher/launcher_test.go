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
