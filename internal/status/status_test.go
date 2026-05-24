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
