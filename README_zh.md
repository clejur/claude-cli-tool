# Claude CLI Launcher

[English](README.md)

Claude CLI Launcher（`ccl`）是一个 Windows 工具，用于管理和快速启动 Claude Code 终端会话。它保存项目配置（目录路径、标签名、启动命令），重启电脑后可以一键恢复所有终端项目。

提供 CLI 命令行工具和 GUI 桌面应用两种使用方式。

## 功能特性

- **项目管理** — 保存、编辑和组织 Claude Code 项目配置
- **一键启动** — 以 Windows Terminal 标签页方式启动项目，使用 `claude --name` 设置会话名，自动检测 PowerShell 7 (pwsh)
- **聚焦运行中的项目** — 将正确的终端窗口唤到前台并切换到对应标签页（支持最小化唤起、多窗口定位、多会话选择）
- **多会话** — 为同一项目启动额外的 Claude 会话（不带 `--continue`），以 `#N` 后缀命名
- **分组** — 将项目组织到命名分组中，支持批量操作
- **工作区** — 保存当前运行中项目的快照，一键恢复
- **进程检测** — 检测正在运行的 Claude 进程并导入为项目（自动以文件夹名命名，支持 npm 更新后的 `claude.exe.old.*`）
- **扫描所有终端** — 可选设置，扫描所有打开的终端会话，而不仅是运行 Claude 的
- **重复检测** — 添加项目时自动检测标签名和路径是否重复
- **状态监控** — 查看哪些项目正在运行（含 PID）
- **GUI 桌面应用** — 功能完整的 Wails + React 界面，含系统托盘
- **单实例运行** — GUI 只能运行一个实例，重复启动会激活已有窗口
- **国际化** — 中英文切换（含错误信息）
- **全局热键** — `Ctrl+Shift+C` 从任何地方唤起 GUI 窗口
- **开机自启** — 可选的 Windows 开机自动启动
- **最小化到托盘** — 可选的关闭最小化到系统托盘，右键菜单支持显示/退出
- **配置导入导出** — 以 JSON 格式导出/导入配置（导入后自动刷新界面）
- **命令预设** — 添加/编辑项目时快速切换 `--continue`、`--resume`、`--fork-session` 标志

## 安装

### CLI

```bash
go install github.com/clejur/claude-launcher/cmd/ccl@latest
```

### GUI

需要 [Wails v2](https://wails.io/) 和 Node.js：

```bash
cd gui
wails build
```

生成的可执行文件位于 `gui/build/bin/claude-cli-launcher.exe`。

## CLI 使用方法

### 添加项目

```bash
# 交互式
ccl add

# 使用参数
ccl add -l "API Server" -p "D:\projects\my-api" -c "claude --continue" -g backend
```

### 列出项目

```bash
ccl list              # 所有项目
ccl list -g backend   # 按分组筛选
```

### 启动项目

```bash
ccl start "API Server"    # 启动单个项目
ccl start --group backend # 启动分组内所有项目
ccl start --all           # 启动全部项目
```

### 查看状态

```bash
ccl status
```

显示哪些项目正在运行及其 PID。

### 编辑项目

```bash
ccl edit "API Server" --label "新标签" --path "D:\new\path" --group frontend
```

### 删除项目

```bash
ccl remove "API Server"
```

### 分组管理

```bash
ccl group add backend
ccl group list
ccl group remove backend
```

### 工作区

```bash
ccl workspace save daily-dev my-api my-frontend my-db
ccl workspace list
ccl workspace restore daily-dev
ccl workspace update daily-dev my-api my-frontend
ccl workspace remove daily-dev
```

### 导入运行中的进程

```bash
ccl import
```

扫描未注册的 Claude 进程并导入。导入时自动以文件夹名作为标签名，标签名冲突时自动添加 `(1)`、`(2)` 后缀。

## GUI 功能

桌面应用包含 CLI 的所有功能，另外提供：

- **项目卡片** — 网格布局显示项目标签名、路径、分组和运行状态
- **聚焦按钮** — 运行中的项目显示"聚焦"按钮，点击后唤起终端窗口并切换到对应标签页（支持最小化唤起、多窗口定位）
- **文件夹选择器** — 路径输入框旁带浏览按钮，可直接选择项目目录
- **搜索** — 按标签名或路径筛选项目
- **右键菜单** — 聚焦/停止、新会话、编辑、移动到分组、删除
- **多会话聚焦** — 项目有多个会话时，聚焦子菜单列出所有标签页供选择
- **侧边栏** — 可折叠的"项目"和"工作区"区域，含分组导航
- **工作区详情** — 点击工作区查看包含的项目，支持选择性启动或编辑工作区内容
- **保存工作区** — 勾选任意项目（运行中或未运行）保存为工作区
- **导入对话框** — 检测并批量导入未注册的 Claude 进程
- **设置页面** — 语言切换（中/英）、开机自启、关闭到托盘开关、扫描所有终端开关、配置导入导出
- **命令预设** — 添加/编辑项目时可快速切换 `--continue`、`--resume`、`--fork-session` 标志

### 全局热键

按 `Ctrl+Shift+C` 从任何地方唤起 GUI 窗口。

## 配置文件

配置存储在 `~/.claude-cli-launcher/config.json`：

```json
{
  "projects": [
    {
      "id": "uuid",
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

## 项目结构

```
claude-cli-launcher/
├── cmd/ccl/             # CLI 入口（Cobra 命令）
├── gui/                 # Wails 桌面应用
│   ├── app.go           # Go 绑定层
│   ├── focus.go         # 窗口聚焦与标签页切换（UI Automation）
│   ├── hotkey.go        # 全局热键（Ctrl+Shift+C）
│   ├── autostart.go     # Windows 注册表开机自启
│   ├── singleton.go     # 单实例互斥锁
│   ├── tray.go          # 系统托盘（getlantern/systray）
│   └── frontend/        # React + TypeScript + Tailwind
│       └── src/
│           ├── components/  # UI 组件
│           └── i18n/        # 国际化（中/英）
├── internal/
│   ├── config/          # JSON 配置存储
│   ├── model/           # 数据模型
│   ├── project/         # 项目 CRUD 服务（含路径去重）
│   ├── group/           # 分组管理
│   ├── workspace/       # 工作区保存/恢复
│   ├── launcher/        # Windows Terminal 标签页启动器
│   └── status/          # 进程扫描与匹配
└── go.mod
```

## 技术栈

- **Go 1.25** — 后端与 CLI
- **Wails v2** — 桌面应用框架（WebView2）
- **React 18 + TypeScript** — 前端界面
- **Tailwind CSS** — 样式
- **Cobra** — CLI 框架
- **gopsutil v3** — 进程检测
- **Windows Terminal (`wt`)** — 标签页启动目标
- **UI Automation** — 通过 .NET System.Windows.Automation 切换标签页

## 系统要求

- Windows 10/11
- [Windows Terminal](https://aka.ms/terminal) 已安装并在 PATH 中可用
- Go 1.25+（编译需要）

## 许可证

MIT
