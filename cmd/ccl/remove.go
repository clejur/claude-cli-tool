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
