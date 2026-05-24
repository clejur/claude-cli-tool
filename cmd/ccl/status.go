package main

import (
	"fmt"
	"os"
	"text/tabwriter"

	"github.com/clejur/claude-launcher/internal/model"
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
