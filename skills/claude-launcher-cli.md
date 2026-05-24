---
name: claude-launcher-cli
description: Skill for managing Claude Code terminal sessions using the `cl` CLI tool. Covers project add/edit/remove/start, group management, workspace save/restore, process import, and status monitoring.
---

# Claude Launcher CLI (`cl`)

Manage and launch Claude Code terminal sessions on Windows. Projects are stored in `~/.claude-launcher/config.json` and launched as Windows Terminal tabs.

## Prerequisites

- Windows 10/11
- Windows Terminal (`wt`) in PATH
- `cl` binary installed (`go install github.com/clejur/claude-launcher/cmd/cl@latest`)

## Commands

### `cl add` — Add a project

```bash
# Interactive mode
cl add

# With flags
cl add -n <name> -p <path> -l <label> -c <command> -g <group>
```

| Flag | Description | Required |
|------|-------------|----------|
| `-n, --name` | Unique project name | Yes |
| `-p, --path` | Absolute directory path | Yes |
| `-l, --label` | Display label (tab title) | Yes |
| `-c, --command` | Launch command (default: `claude`) | No |
| `-g, --group` | Group to assign to | No |

Rejects duplicate names or paths.

### `cl list` — List projects

```bash
cl list              # All projects
cl list -g <group>   # Filter by group
```

Output: table with NAME, LABEL, PATH, GROUP columns.

### `cl edit` — Edit a project

```bash
cl edit <name|id> [flags]
```

| Flag | Description |
|------|-------------|
| `--label` | New display label |
| `--path` | New directory path |
| `--command` | New launch command |
| `--group` | New group assignment |

Only specified flags are updated; others remain unchanged.

### `cl remove` — Remove a project

```bash
cl remove <name|id>
```

Removes the project from config. Does not stop running processes.

### `cl start` — Start projects

```bash
cl start <name|id>       # Start one project
cl start --all           # Start all projects
cl start --group <name>  # Start all in a group
```

| Flag | Description |
|------|-------------|
| `-a, --all` | Start all configured projects |
| `-g, --group` | Start all projects in the specified group |

Each project launches as a new Windows Terminal tab with title `✳ <label>`. Uses `pwsh` if available, falls back to `powershell`.

### `cl status` — Check running status

```bash
cl status                # All projects
cl status <name|id>      # Single project
cl status -g <group>     # Filter by group
```

Output: table with NAME, GROUP, STATUS (running/stopped), PID.

### `cl group` — Manage groups

```bash
cl group add <name>      # Create a group
cl group list            # List all groups
cl group remove <name>   # Delete a group
```

Groups are labels for organizing projects. Removing a group does not remove projects in it.

### `cl workspace` — Manage workspaces

Workspaces are named snapshots of project sets for batch restore.

```bash
cl workspace save <name> <project-names...>    # Save workspace
cl workspace list                              # List workspaces
cl workspace restore <name>                    # Launch all projects in workspace
cl workspace update <name> <project-names...>  # Replace workspace contents
cl workspace remove <name>                     # Delete workspace
```

`restore` launches all workspace projects as terminal tabs (same behavior as `cl start`).

### `cl import` — Import running Claude processes

```bash
cl import        # Interactive selection
cl import --all  # Import all without prompting
```

Scans for running Claude processes not already registered. Auto-names by folder. Appends `(1)`, `(2)` suffix on name conflict.

## Configuration

Stored at `~/.claude-launcher/config.json`:

```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "my-api",
      "label": "API Server",
      "path": "D:\\projects\\my-api",
      "command": "claude",
      "group": "backend"
    }
  ],
  "groups": ["backend", "frontend"],
  "workspaces": [
    {
      "name": "daily-dev",
      "project_ids": ["uuid1", "uuid2"]
    }
  ]
}
```

## Common Workflows

### Set up a new project

```bash
cl add -n my-api -p "D:\projects\my-api" -l "API Server" -c claude -g backend
cl start my-api
```

### Restore all work after reboot

```bash
cl workspace restore daily-dev
```

### Check what's running

```bash
cl status
```

### Import already-running sessions

```bash
cl import --all
```

### Batch start a group

```bash
cl start --group backend
```

## Error Handling

- `cl start` fails if Windows Terminal (`wt`) is not found in PATH
- `cl add` rejects duplicate project names or paths
- `cl edit` / `cl remove` / `cl start <name>` fail if project not found
- `cl workspace restore` fails if workspace has no valid projects
