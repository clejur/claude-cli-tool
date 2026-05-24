# Claude Launcher - 设计文档

## 概述

`claude-launcher`（CLI 命令：`cl`）是一个 Claude Code 终端会话管理工具，用于保存、组织和快速启动 Claude 终端项目。解决重启电脑后 Windows Terminal 标签页配置丢失的问题。

## 技术栈

- **语言**：Go
- **CLI**：cobra（Go CLI 框架）
- **GUI**：Wails（Go + WebView2）
- **前端**：React + Tailwind CSS
- **存储**：JSON 文件（`~/.claude-launcher/config.json`）
- **终端集成**：Windows Terminal `wt` 命令

## 核心概念

| 概念 | 说明 |
|------|------|
| Project | 一个 Claude 终端项目配置（目录、标签名、启动命令、分组） |
| Group | 项目分组，用于组织项目（如"前端"、"后端"、"工具"） |
| Workspace | 一组 Project 的快照，代表一次工作场景，用于批量恢复 |

## 数据模型

存储路径：`~/.claude-launcher/config.json`

```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "my-api",
      "label": "🔥 API Server",
      "path": "D:\\projects\\my-api",
      "command": "claude",
      "group": "backend",
      "createdAt": "2026-05-24T10:00:00Z"
    }
  ],
  "groups": ["frontend", "backend", "tools"],
  "workspaces": [
    {
      "id": "uuid",
      "name": "日常开发",
      "projectIds": ["uuid1", "uuid2", "uuid3"]
    }
  ]
}
```

## CLI 命令设计

命令名：`cl`

### 项目管理

```
cl add                           # 交互式添加项目
cl add -p <path> -l <label> -g <group> -c <command>  # 参数式添加
cl list                          # 列出所有项目
cl list -g <group>               # 按分组过滤
cl edit <name|id>                # 编辑项目配置
cl remove <name|id>              # 删除项目
```

### 启动

```
cl start <name|id>               # 启动单个项目（新开 WT 标签页）
cl start --all                   # 启动所有项目
cl start -g <group>              # 启动某分组的所有项目
```

### 状态检测

```
cl status                        # 查看所有项目的 Claude 运行状态
cl status <name|id>              # 查看单个项目的状态
cl status -g <group>             # 查看某分组的状态
```

状态检测原理：扫描系统进程，匹配 `claude` 进程的工作目录与已注册项目的 `path` 字段。输出示例：

```
NAME        GROUP      STATUS     PID
my-api      backend    running    12345
my-web      frontend   stopped    -
my-tool     tools      running    67890
```

### 分组管理

```
cl group add <name>              # 添加分组
cl group list                    # 列出分组
cl group remove <name>           # 删除分组
```

### Workspace 管理

```
cl workspace save <name> [project-names...]  # 保存指定项目为 workspace（不指定则交互选择）
cl workspace list                            # 列出所有 workspace
cl workspace restore <name>                  # 恢复一个 workspace（批量打开）
cl workspace remove <name>                   # 删除 workspace
```

## 启动机制

通过调用 Windows Terminal 的 `wt` 命令行接口实现：

```powershell
wt new-tab --title "🔥 API Server" --startingDirectory "D:\projects\my-api" powershell -NoExit -Command "claude"
```

批量启动时，使用 `wt` 的分号语法在一次调用中打开多个标签页：

```powershell
wt new-tab --title "Tab1" --startingDirectory "D:\p1" powershell -NoExit -Command "claude" ; new-tab --title "Tab2" --startingDirectory "D:\p2" powershell -NoExit -Command "claude"
```

## GUI 设计 (Wails)

### 主界面布局

- **左侧**：分组导航栏（All / Frontend / Backend / Tools...）
- **中间**：项目列表（卡片式，显示名称、标签、路径、状态）
- **顶部**：搜索框 + "添加项目"按钮 + "恢复 Workspace"下拉

### 核心操作

- 点击项目卡片 → 启动该项目
- 右键项目 → 编辑 / 删除 / 移动分组 / 停止（仅对运行中的项目）
- 拖拽排序
- Workspace 下拉 → 一键恢复

### 状态展示

- 每张项目卡片右上角显示状态指示灯（绿色=运行中，灰色=已停止）
- 运行中的项目显示 PID
- 每 5 秒自动轮询刷新状态
- 可对运行中的项目右键"停止"

### 系统集成

- 系统托盘图标（最小化到托盘）
- 可选：开机自启
- 全局快捷键唤起（如 `Ctrl+Shift+C`）

## 项目结构

```
claude-launcher/
├── cmd/
│   └── cl/
│       └── main.go              # CLI 入口
├── internal/
│   ├── config/
│   │   └── config.go            # 配置读写（JSON）
│   ├── project/
│   │   └── project.go           # 项目 CRUD 逻辑
│   ├── workspace/
│   │   └── workspace.go         # Workspace 管理
│   ├── launcher/
│   │   └── launcher.go          # Windows Terminal 启动逻辑
│   └── group/
│       └── group.go             # 分组管理
├── gui/                          # Wails GUI（第二阶段）
│   ├── app.go                   # Wails 绑定
│   └── frontend/                # React 前端
│       ├── src/
│       └── ...
├── go.mod
└── go.sum
```

## 分阶段交付

### Phase 1：CLI 核心

- 配置文件读写
- 项目 CRUD（add/list/edit/remove）
- 分组管理
- 启动功能（单个 + 批量 + 按组）
- Workspace 保存与恢复
- 项目状态检测（检查 Claude 是否在运行）

### Phase 2：Wails GUI

- 项目可视化管理界面
- 系统托盘
- 拖拽排序
- Workspace 管理 UI

### Phase 3：高级功能

- 全局快捷键唤起
- 开机自启
- 配置导入导出

## 错误处理

- `wt` 命令不存在 → 提示用户安装 Windows Terminal
- 项目目录不存在 → 启动时警告，询问是否仍要打开
- 配置文件损坏 → 自动备份 + 提示恢复

## 约束与假设

- 目标平台：Windows 11（依赖 Windows Terminal 的 `wt` 命令）
- 配置文件使用 JSON 格式，人类可读可编辑
- GUI 部分依赖 WebView2（Win11 内置）
