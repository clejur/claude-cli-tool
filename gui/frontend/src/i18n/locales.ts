export const locales = {
  en: {
    // App header
    allProjects: 'All Projects',
    addProject: '+ Add Project',
    import: 'Import',
    noProjectsFound: 'No projects found. Click "+ Add Project" to get started.',

    // Sidebar
    groups: 'Groups',
    addGroup: '+ Add Group',
    groupNamePrompt: 'Group name:',

    // ProjectCard
    running: 'Running',
    stopped: 'Stopped',
    ungrouped: 'ungrouped',
    start: 'Start',
    edit: 'Edit',
    del: 'Del',

    // AddProjectDialog
    addProjectTitle: 'Add Project',
    nameRequired: 'Name *',
    namePlaceholder: 'my-api',
    tabLabel: 'Tab Label',
    labelPlaceholder: 'Same as name if empty',
    pathRequired: 'Path *',
    pathPlaceholder: 'D:\\projects\\my-api',
    command: 'Command',
    group: 'Group',
    noGroup: 'No group',
    cancel: 'Cancel',
    add: 'Add',
    namePathRequired: 'Name and path are required',

    // EditProjectDialog
    editTitle: 'Edit:',
    save: 'Save',

    // WorkspaceMenu
    workspaces: 'Workspaces',
    saveWorkspace: '+ Save current as workspace',
    workspaceNamePrompt: 'Workspace name:',
    noWorkspaces: 'No workspaces saved.',

    // ImportDialog
    importTitle: 'Import Running Processes',
    scanning: 'Scanning processes...',
    noUnregistered: 'No unregistered Claude processes detected.',
    processesFound: (n: number) => `${n} process(es) found`,
    selectAll: 'Select all',
    deselectAll: 'Deselect all',
    importing: 'Importing...',
    importCount: (n: number) => `Import (${n})`,
    removeConfirm: 'Remove this project?',

    // Settings
    settings: 'Settings',
    language: 'Language',
    langEn: 'English',
    langZh: '中文',
  },
  zh: {
    allProjects: '所有项目',
    addProject: '+ 添加项目',
    import: '导入',
    noProjectsFound: '暂无项目，点击"+ 添加项目"开始。',

    groups: '分组',
    addGroup: '+ 添加分组',
    groupNamePrompt: '分组名称：',

    running: '运行中',
    stopped: '已停止',
    ungrouped: '未分组',
    start: '启动',
    edit: '编辑',
    del: '删除',

    addProjectTitle: '添加项目',
    nameRequired: '名称 *',
    namePlaceholder: 'my-api',
    tabLabel: '标签名',
    labelPlaceholder: '留空则与名称相同',
    pathRequired: '路径 *',
    pathPlaceholder: 'D:\\projects\\my-api',
    command: '命令',
    group: '分组',
    noGroup: '无分组',
    cancel: '取消',
    add: '添加',
    namePathRequired: '名称和路径为必填项',

    editTitle: '编辑：',
    save: '保存',

    workspaces: '工作区',
    saveWorkspace: '+ 保存当前为工作区',
    workspaceNamePrompt: '工作区名称：',
    noWorkspaces: '暂无已保存的工作区。',

    importTitle: '导入运行中的进程',
    scanning: '正在扫描进程...',
    noUnregistered: '未检测到未注册的 Claude 进程。',
    processesFound: (n: number) => `发现 ${n} 个进程`,
    selectAll: '全选',
    deselectAll: '取消全选',
    importing: '导入中...',
    importCount: (n: number) => `导入 (${n})`,
    removeConfirm: '确定移除此项目？',

    settings: '设置',
    language: '语言',
    langEn: 'English',
    langZh: '中文',
  },
}

export type Locale = keyof typeof locales
export type Translations = typeof locales['en']
