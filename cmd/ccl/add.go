package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"github.com/spf13/cobra"
)

var addCmd = &cobra.Command{
	Use:   "add",
	Short: "Add a new project",
	RunE: func(cmd *cobra.Command, args []string) error {
		label, _ := cmd.Flags().GetString("label")
		path, _ := cmd.Flags().GetString("path")
		command, _ := cmd.Flags().GetString("command")
		group, _ := cmd.Flags().GetString("group")

		if label == "" || path == "" {
			return addInteractive()
		}

		if command == "" {
			command = "claude"
		}

		p, err := projectSvc.Add(label, path, command, group)
		if err != nil {
			return err
		}
		fmt.Printf("Added project %q (id: %s)\n", p.Label, p.ID)
		return nil
	},
}

func addInteractive() error {
	reader := bufio.NewReader(os.Stdin)

	fmt.Print("Project label: ")
	label, _ := reader.ReadString('\n')
	label = strings.TrimSpace(label)

	fmt.Print("Project path: ")
	path, _ := reader.ReadString('\n')
	path = strings.TrimSpace(path)

	fmt.Print("Command (default: claude): ")
	command, _ := reader.ReadString('\n')
	command = strings.TrimSpace(command)
	if command == "" {
		command = "claude"
	}

	fmt.Print("Group (optional): ")
	group, _ := reader.ReadString('\n')
	group = strings.TrimSpace(group)

	p, err := projectSvc.Add(label, path, command, group)
	if err != nil {
		return err
	}
	fmt.Printf("Added project %q (id: %s)\n", p.Label, p.ID)
	return nil
}

func init() {
	addCmd.Flags().StringP("label", "l", "", "Project label")
	addCmd.Flags().StringP("path", "p", "", "Project directory path")
	addCmd.Flags().StringP("command", "c", "", "Launch command (default: claude)")
	addCmd.Flags().StringP("group", "g", "", "Project group")
	rootCmd.AddCommand(addCmd)
}
