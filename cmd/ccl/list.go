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
