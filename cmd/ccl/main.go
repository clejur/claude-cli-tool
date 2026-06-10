package main

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"

	"github.com/clejur/claude-cli-tool/internal/config"
	"github.com/clejur/claude-cli-tool/internal/group"
	"github.com/clejur/claude-cli-tool/internal/launcher"
	"github.com/clejur/claude-cli-tool/internal/project"
	"github.com/clejur/claude-cli-tool/internal/workspace"
)

var (
	store        *config.Store
	projectSvc   *project.Service
	groupSvc     *group.Service
	workspaceSvc *workspace.Service
	launcherSvc  *launcher.Launcher
)

var rootCmd = &cobra.Command{
	Use:   "ccl",
	Short: "Claude CLI Launcher - manage and launch Claude Code terminal sessions",
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
