---
name: claude-cli-launcher
description: Skill for managing Claude Code terminal sessions using the `ccl` CLI tool. Covers project add/edit/remove/start, group management, workspace save/restore, process import, and status monitoring.
---

# Claude CLI Launcher (`ccl`)

Manage and launch Claude Code terminal sessions on Windows. Projects are stored in `~/.claude-cli-launcher/config.json` and launched as Windows Terminal tabs.

## Prerequisites

- Windows 10/11
- Windows Terminal (`wt`) in PATH
- `ccl` binary installed (`go install github.com/clejur/claude-launcher/cmd/ccl@latest`)

## Commands

### `ccl add` — Add a project

```bash
# Interactive mode
ccl add

# With flags
ccl add -n <name> -p <path> -l <label> -c <command> -g <group>
```

| Flag | Description | Required |
|------|-------------|----------|
| `-n, --name` | Unique project name | Yes |
| `-p, --path` | Absolute directory path | Yes |
| `-l, --label` | Display label (tab title) | Yes |
| `-c, --command` | Launch command (default: `claude --continue`) | No |
| `-g, --group` | Group to assign to | No |

Rejects duplicate names or paths.

### `ccl list` — List projects

```bash
ccl list              # All projects
ccl list -g <group>   # Filter by group
```

Output: table with NAME, LABEL, PATH, GROUP columns.

### `ccl edit` — Edit a project

```bash
ccl edit <name|id> [flags]
```

| Flag | Description |
|------|-------------|
| `--label` | New display label |
| `--path` | New directory path |
| `--command` | New launch command |
| `--group` | New group assignment |

Only specified flags are updated; others remain unchanged.

### `ccl remove` — Remove a project

```bash
ccl remove <name|id>
```

Removes the project from config. Does not stop running processes.

### `ccl start` — Start projects

```bash
ccl start <name|id>       # Start one project
ccl start --all           # Start all projects
ccl start --group <name>  # Start all in a group
```

| Flag | Description |
|------|-------------|
| `-a, --all` | Start all configured projects |
| `-g, --group` | Start all projects in the specified group |

Each project launches as a new Windows Terminal tab. Uses `claude --name "Label"` for session naming. Uses `pwsh` if available, falls back to `powershell`.

### `ccl status` — Check running status

```bash
ccl status                # All projects
ccl status <name|id>      # Single project
ccl status -g <group>     # Filter by group
```

Output: table with NAME, GROUP, STATUS (running/stopped), PID.

### `ccl group` — Manage groups

```bash
ccl group add <name>      # Create a group
ccl group list            # List all groups
ccl group remove <name>   # Delete a group
```

Groups are labels for organizing projects. Removing a group does not remove projects in it.

### `ccl workspace` — Manage workspaces

Workspaces are named snapshots of project sets for batch restore.

```bash
ccl workspace save <name> <project-names...>    # Save workspace
ccl workspace list                              # List workspaces
ccl workspace restore <name>                    # Launch all projects in workspace
ccl workspace update <name> <project-names...>  # Replace workspace contents
ccl workspace remove <name>                     # Delete workspace
```

`restore` launches all workspace projects as terminal tabs (same behavior as `ccl start`).

### `ccl import` — Import running Claude processes

```bash
ccl import        # Interactive selection
ccl import --all  # Import all without prompting
```

Scans for running Claude processes not already registered. Auto-names by folder. Appends `(1)`, `(2)` suffix on name conflict.

## Configuration

Stored at `~/.claude-cli-launcher/config.json`:

```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "my-api",
      "label": "API Server",
      "path": "D:\\projects\\my-api",
      "command": "claude --continue",
      "group": "backend"
    }
  ],
  "groups": ["backend", "frontend"],
  "workspaces": [
    {
      "name": "daily-dev",
      "project_ids": ["uuid1", "uuid2"]
    }
  ],
  "settings": {
    "close_to_tray": true
  }
}
```

## Common Workflows

### Set up a new project

```bash
ccl add -n my-api -p "D:\projects\my-api" -l "API Server" -c "claude --continue" -g backend
ccl start my-api
```

### Restore all work after reboot

```bash
ccl workspace restore daily-dev
```

### Check what's running

```bash
ccl status
```

### Import already-running sessions

```bash
ccl import --all
```

### Batch start a group

```bash
ccl start --group backend
```

## Error Handling

- `ccl start` fails if Windows Terminal (`wt`) is not found in PATH
- `ccl add` rejects duplicate project names or paths
- `ccl edit` / `ccl remove` / `ccl start <name>` fail if project not found
- `ccl workspace restore` fails if workspace has no valid projects
