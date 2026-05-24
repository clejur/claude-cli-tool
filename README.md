# Claude CLI Launcher

Claude CLI Launcher (`ccl`) is a Windows tool for managing and quickly launching Claude Code terminal sessions. It saves project configurations (directory path, tab label, launch command) and restores them with a single command — no more re-navigating after a reboot.

Available as both a CLI tool and a GUI desktop app.

## Features

- **Project Management** — Save, edit, and organize Claude Code project configurations
- **One-click Launch** — Start projects as Windows Terminal tabs with `claude --name` for session naming, auto-detects PowerShell 7 (pwsh)
- **Focus Running Projects** — Bring the correct terminal window to foreground and switch to the exact tab (supports multiple windows)
- **Groups** — Organize projects into named groups for batch operations
- **Workspaces** — Save snapshots of running projects and restore them together
- **Process Detection** — Detect running Claude processes and import them (auto-named by folder)
- **Duplicate Prevention** — Rejects adding projects with duplicate names or paths
- **Status Monitoring** — See which projects are currently running (with PID)
- **GUI Desktop App** — Full-featured Wails + React interface with system tray
- **Single Instance** — Only one GUI instance can run; re-launching activates the existing window
- **i18n** — Chinese/English language toggle (errors included)
- **Global Hotkey** — `Ctrl+Shift+C` to show the GUI window from anywhere
- **Auto-start** — Optional launch on Windows boot
- **Minimize to Tray** — Optional close-to-tray behavior with right-click menu (Show/Quit)
- **Config Portability** — Export/import configuration as JSON (auto-refreshes UI after import)
- **Command Presets** — Quick-toggle `--continue`, `--resume`, `--fork-session` flags in project dialogs

## Installation

### CLI

```bash
go install github.com/clejur/claude-launcher/cmd/ccl@latest
```

### GUI

Requires [Wails v2](https://wails.io/) and Node.js:

```bash
cd gui
wails build
```

The binary will be at `gui/build/bin/claude-cli-launcher.exe`.

## CLI Usage

### Add a project

```bash
# Interactive mode
ccl add

# With flags
ccl add -n my-api -p "D:\projects\my-api" -l "API Server" -c "claude --continue" -g backend
```

### List projects

```bash
ccl list              # All projects
ccl list -g backend   # Filter by group
```

### Start projects

```bash
ccl start my-api          # Start one project
ccl start --group backend # Start all in a group
ccl start --all           # Start everything
```

### Check status

```bash
ccl status
```

Shows which projects are running and their PIDs.

### Edit a project

```bash
ccl edit my-api --label "New Label" --path "D:\new\path" --group frontend
```

### Remove a project

```bash
ccl remove my-api
```

### Groups

```bash
ccl group add backend
ccl group list
ccl group remove backend
```

### Workspaces

```bash
ccl workspace save daily-dev my-api my-frontend my-db
ccl workspace list
ccl workspace restore daily-dev
ccl workspace update daily-dev my-api my-frontend
ccl workspace remove daily-dev
```

### Import running processes

```bash
ccl import
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
- **Settings Page** — Language toggle (EN/ZH), auto-start, close-to-tray toggle, config export/import
- **Command Presets** — Toggle `--continue`, `--resume`, `--fork-session` flags when adding/editing projects

### Global Hotkey

Press `Ctrl+Shift+C` to bring the GUI window to focus from anywhere.

## Configuration

Config is stored at `~/.claude-cli-launcher/config.json`:

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

## Project Structure

```
claude-cli-launcher/
├── cmd/ccl/             # CLI entry point (Cobra commands)
├── gui/                 # Wails desktop app
│   ├── app.go           # Go bindings exposed to frontend
│   ├── focus.go         # Window focus & tab switching (UI Automation)
│   ├── hotkey.go        # Global hotkey (Ctrl+Shift+C)
│   ├── autostart.go     # Windows registry auto-start
│   ├── singleton.go     # Single instance mutex
│   ├── tray.go          # System tray (energye/systray)
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
