package main

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/spf13/cobra"

	"github.com/clejur/claude-launcher/internal/status"
)

var importCmd = &cobra.Command{
	Use:   "import",
	Short: "Import running Claude processes as projects",
	RunE: func(cmd *cobra.Command, args []string) error {
		all, _ := cmd.Flags().GetBool("all")

		processes, err := status.ScanProcesses(false)
		if err != nil {
			return fmt.Errorf("scanning processes: %w", err)
		}

		existing, err := projectSvc.List("")
		if err != nil {
			return err
		}

		registeredPaths := make(map[string]bool)
		for _, p := range existing {
			registeredPaths[strings.ToLower(filepath.Clean(p.Path))] = true
		}

		var unregistered []status.ProcessInfo
		for _, proc := range processes {
			key := strings.ToLower(filepath.Clean(proc.Cwd))
			if !registeredPaths[key] {
				unregistered = append(unregistered, proc)
			}
		}

		if len(unregistered) == 0 {
			fmt.Println("No unregistered Claude processes found.")
			return nil
		}

		fmt.Printf("Found %d unregistered Claude process(es):\n\n", len(unregistered))
		for i, proc := range unregistered {
			fmt.Printf("  [%d] PID %d  %s\n", i+1, proc.PID, proc.Cwd)
		}
		fmt.Println()

		var selected []int
		if all {
			for i := range unregistered {
				selected = append(selected, i)
			}
		} else {
			fmt.Print("Import which? (number, comma-separated, or 'all'): ")
			reader := bufio.NewReader(os.Stdin)
			input, _ := reader.ReadString('\n')
			input = strings.TrimSpace(input)

			if strings.ToLower(input) == "all" {
				for i := range unregistered {
					selected = append(selected, i)
				}
			} else {
				for _, part := range strings.Split(input, ",") {
					n, err := strconv.Atoi(strings.TrimSpace(part))
					if err != nil || n < 1 || n > len(unregistered) {
						return fmt.Errorf("invalid selection: %s", part)
					}
					selected = append(selected, n-1)
				}
			}
		}

		existingLabels := make(map[string]bool)
		for _, p := range existing {
			existingLabels[strings.ToLower(p.Label)] = true
		}

		for _, idx := range selected {
			proc := unregistered[idx]
			label := filepath.Base(proc.Cwd)
			label = dedupName(label, existingLabels)
			p, err := projectSvc.Add(label, proc.Cwd, "claude --continue", "")
			if err != nil {
				fmt.Fprintf(os.Stderr, "  Failed to import %s: %v\n", proc.Cwd, err)
				continue
			}
			existingLabels[strings.ToLower(label)] = true
			fmt.Printf("  Imported %q (%s)\n", p.Label, p.Path)
		}
		return nil
	},
}

func dedupName(name string, existing map[string]bool) string {
	if !existing[strings.ToLower(name)] {
		return name
	}
	for i := 1; ; i++ {
		candidate := fmt.Sprintf("%s(%d)", name, i)
		if !existing[strings.ToLower(candidate)] {
			return candidate
		}
	}
}

func init() {
	importCmd.Flags().BoolP("all", "a", false, "Import all detected processes without prompting")
	rootCmd.AddCommand(importCmd)
}
