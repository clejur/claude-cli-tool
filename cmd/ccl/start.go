package main

import (
	"fmt"

	"github.com/clejur/claude-cli-tool/internal/model"
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

		fmt.Printf("Starting %q...\n", p.Label)
		return launcherSvc.Launch([]model.Project{*p})
	},
}

func init() {
	startCmd.Flags().BoolP("all", "a", false, "Start all projects")
	startCmd.Flags().StringP("group", "g", "", "Start all projects in a group")
	rootCmd.AddCommand(startCmd)
}
