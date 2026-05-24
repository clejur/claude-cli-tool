# Claude Launcher

Claude Launcher (`cl`) is a Windows tool for managing and quickly launching Claude Code terminal sessions. It saves project configurations (directory path, tab label, launch command) and restores them with a single command — no more re-navigating after a reboot.

Available as both a CLI tool and a GUI desktop app.

## Features

- **Project Management** — Save, edit, and organize Claude Code project configurations
- **One-click Launch** — Start projects as Windows Terminal tabs with `✳` icon prefix, auto-detects PowerShell 7 (pwsh)
- **Focus Running Projects** — Bring the correct terminal window to foreground and switch to the exact tab (supports multiple windows)
- **Groups** — Organize projects into named groups for batch operations
- **Workspaces** — Save snapshots of running projects and restore them together
- **Process Detection** — Detect running Claude processes and import them (auto-named by folder)
- **Duplicate Prevention** — Rejects adding projects with duplicate names or paths
- **Status Monitoring** — See which projects are currently running (with PID)
- **GUI Desktop App** — Full-featured Wails + React interface
- **i18n** — Chinese/English language toggle (errors included)
- **Global Hotkey** — `Ctrl+Shift+C` to show the GUI window from anywhere
- **Auto-start** — Optional launch on Windows boot
- **Config Portability** — Export/import configuration as JSON

## Installation

### CLI

```bash
go install github.com/clejur/claude-launcher/cmd/cl@latest
```

### GUI

Requires [Wails v2](https://wails.io/) and Node.js:

```bash
cd gui
wails build
```

The binary will be at `gui/build/bin/claude-launcher.exe`.

## CLI Usage

### Add a project

```bash
# Interactive mode
cl add

# With flags
cl add -n my-api -p "D:\projects\my-api" -l "API Server" -c claude -g backend
```

### List projects

```bash
cl list              # All projects
cl list -g backend   # Filter by group
```

### Start projects

```bash
cl start my-api          # Start one project
cl start --group backend # Start all in a group
cl start --all           # Start everything
```

### Check status

```bash
cl status
```

Shows which projects are running and their PIDs.

### Edit a project

```bash
cl edit my-api --label "New Label" --path "D:\new\path" --group frontend
```

### Remove a project

```bash
cl remove my-api
```

### Groups

```bash
cl group add backend
cl group list
cl group remove backend
```

### Workspaces

```bash
cl workspace save daily-dev my-api my-frontend my-db
cl workspace list
cl workspace restore daily-dev
cl workspace update daily-dev my-api my-frontend
cl workspace remove daily-dev
```

### Import running processes

```bash
cl import
```

Scans for running Claude processes not yet registered and lets you import them. Imported projects are automatically named after their folder. If the name conflicts, a suffix like `(1)`, `(2)` is appended.

## GUI Features

The desktop app provides all CLI capabilities plus:

- **Project Cards** — Visual grid showing project name, path, group, and running status
- **Focus Button** — For running projects, click "Focus" to bring the terminal window to foreground and switch to the correct tab (works even when minimized, supports multiple terminal windows)
- **Folder Picker** — Browse button on path input to select project directory
- **Search** — Filter projects by name, label, or path
- **Right-click Context Menu** — Focus/Stop, Edit, Move to group, Delete
- **Sidebar** — Collapsible "Projects" and "Workspaces" sections with group navigation
- **Workspace Detail** — Click a workspace to see its projects, selectively start them, or edit the workspace contents
- **Save Workspace** — Select any projects (running or not) via checkboxes to save as workspace
- **Import Dialog** — Detect and bulk-import unregistered Claude processes
- **Settings Page** — Dedicated full page for language toggle (EN/ZH), auto-start, config export/import

### Global Hotkey

Press `Ctrl+Shift+C` to bring the GUI window to focus from anywhere.

## Configuration

Config is stored at `~/.claude-launcher/config.json`:

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

## Project Structure

```
claude-launcher/
├── cmd/cl/              # CLI entry point (Cobra commands)
├── gui/                 # Wails desktop app
│   ├── app.go           # Go bindings exposed to frontend
│   ├── focus.go         # Window focus & tab switching (UI Automation)
│   ├── hotkey.go        # Global hotkey (Ctrl+Shift+C)
│   ├── autostart.go     # Windows registry auto-start
│   └── frontend/        # React + TypeScript + Tailwind
│       └── src/
│           ├── components/  # UI components
│           └── i18n/        # Localization (en/zh)
├── internal/
│   ├── config/          # JSON config store
│   ├── model/           # Data models
│   ├── project/         # Project CRUD service (with path dedup)
│   ├── group/           # Group management
│   ├── workspace/       # Workspace save/restore
│   ├── launcher/        # Windows Terminal tab launcher
│   └── status/          # Process scanning & matching
└── go.mod
```

## Tech Stack

- **Go 1.25** — Backend and CLI
- **Wails v2** — Desktop app framework (WebView2)
- **React 18 + TypeScript** — Frontend UI
- **Tailwind CSS** — Styling
- **Cobra** — CLI framework
- **gopsutil v3** — Process detection
- **Windows Terminal (`wt`)** — Tab launcher target
- **UI Automation** — Tab switching via .NET System.Windows.Automation

## Requirements

- Windows 10/11
- [Windows Terminal](https://aka.ms/terminal) installed and available in PATH
- Go 1.25+ (for building)

## License

MIT
