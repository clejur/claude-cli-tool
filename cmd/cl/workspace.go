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

var workspaceUpdateCmd = &cobra.Command{
	Use:   "update <name> [project-names...]",
	Short: "Update projects in a workspace",
	Args:  cobra.MinimumNArgs(2),
	RunE: func(cmd *cobra.Command, args []string) error {
		name := args[0]
		projectNames := args[1:]

		ws, err := workspaceSvc.Update(name, projectNames)
		if err != nil {
			return err
		}
		fmt.Printf("Updated workspace %q with %d projects\n", ws.Name, len(ws.ProjectIDs))
		return nil
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
	workspaceCmd.AddCommand(workspaceUpdateCmd)
	workspaceCmd.AddCommand(workspaceRemoveCmd)
	rootCmd.AddCommand(workspaceCmd)
}
