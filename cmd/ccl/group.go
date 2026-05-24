package main

import (
	"fmt"

	"github.com/spf13/cobra"
)

var groupCmd = &cobra.Command{
	Use:   "group",
	Short: "Manage project groups",
}

var groupAddCmd = &cobra.Command{
	Use:   "add <name>",
	Short: "Add a new group",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		err := groupSvc.Add(args[0])
		if err != nil {
			return err
		}
		fmt.Printf("Added group %q\n", args[0])
		return nil
	},
}

var groupListCmd = &cobra.Command{
	Use:   "list",
	Short: "List all groups",
	RunE: func(cmd *cobra.Command, args []string) error {
		groups, err := groupSvc.List()
		if err != nil {
			return err
		}
		if len(groups) == 0 {
			fmt.Println("No groups found.")
			return nil
		}
		for _, g := range groups {
			fmt.Println(g)
		}
		return nil
	},
}

var groupRemoveCmd = &cobra.Command{
	Use:   "remove <name>",
	Short: "Remove a group",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		err := groupSvc.Remove(args[0])
		if err != nil {
			return err
		}
		fmt.Printf("Removed group %q\n", args[0])
		return nil
	},
}

func init() {
	groupCmd.AddCommand(groupAddCmd)
	groupCmd.AddCommand(groupListCmd)
	groupCmd.AddCommand(groupRemoveCmd)
	rootCmd.AddCommand(groupCmd)
}
