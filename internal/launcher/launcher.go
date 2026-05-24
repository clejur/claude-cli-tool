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
