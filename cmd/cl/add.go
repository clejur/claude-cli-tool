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
		name, _ := cmd.Flags().GetString("name")
		label, _ := cmd.Flags().GetString("label")
		path, _ := cmd.Flags().GetString("path")
		command, _ := cmd.Flags().GetString("command")
		group, _ := cmd.Flags().GetString("group")

		if name == "" || path == "" {
			return addInteractive()
		}

		if label == "" {
			label = name
		}
		if command == "" {
			command = "claude"
		}

		p, err := projectSvc.Add(name, label, path, command, group)
		if err != nil {
			return err
		}
		fmt.Printf("Added project %q (id: %s)\n", p.Name, p.ID)
		return nil
	},
}

func addInteractive() error {
	reader := bufio.NewReader(os.Stdin)

	fmt.Print("Project name: ")
	name, _ := reader.ReadString('\n')
	name = strings.TrimSpace(name)

	fmt.Print("Project path: ")
	path, _ := reader.ReadString('\n')
	path = strings.TrimSpace(path)

	fmt.Print("Tab label (default: same as name): ")
	label, _ := reader.ReadString('\n')
	label = strings.TrimSpace(label)
	if label == "" {
		label = name
	}

	fmt.Print("Command (default: claude): ")
	command, _ := reader.ReadString('\n')
	command = strings.TrimSpace(command)
	if command == "" {
		command = "claude"
	}

	fmt.Print("Group (optional): ")
	group, _ := reader.ReadString('\n')
	group = strings.TrimSpace(group)

	p, err := projectSvc.Add(name, label, path, command, group)
	if err != nil {
		return err
	}
	fmt.Printf("Added project %q (id: %s)\n", p.Name, p.ID)
	return nil
}

func init() {
	addCmd.Flags().StringP("name", "n", "", "Project name")
	addCmd.Flags().StringP("path", "p", "", "Project directory path")
	addCmd.Flags().StringP("label", "l", "", "Tab label (default: same as name)")
	addCmd.Flags().StringP("command", "c", "", "Launch command (default: claude)")
	addCmd.Flags().StringP("group", "g", "", "Project group")
	rootCmd.AddCommand(addCmd)
}
