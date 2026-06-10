package main

import (
	"fmt"

	"github.com/clejur/claude-cli-tool/internal/project"
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
		fmt.Printf("Updated project %q\n", p.Label)
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
