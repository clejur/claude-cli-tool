import { useState, useCallback } from 'react'
import { Sidebar } from './components/Sidebar'
import { SearchBar } from './components/SearchBar'
import { ProjectCard } from './components/ProjectCard'
import { ContextMenu, type ContextMenuItem } from './components/ContextMenu'
import { ConfirmDialog } from './components/ConfirmDialog'
import { AddProjectDialog } from './components/AddProjectDialog'
import { EditProjectDialog } from './components/EditProjectDialog'
import { ImportDialog } from './components/ImportDialog'
import { SaveWorkspaceDialog } from './components/SaveWorkspaceDialog'
import { WorkspacePage } from './components/WorkspacePage'
import { SettingsPage } from './components/SettingsPage'
import { useGroups } from './hooks/useGroups'
import { useProjects } from './hooks/useProjects'
import { useWorkspaces } from './hooks/useWorkspaces'
import { useT } from './i18n/context'
import { StopProject, FocusProject } from '../wailsjs/go/main/App'
import { model } from '../wailsjs/go/models'

function App() {
  const t = useT()
  const [currentPage, setCurrentPage] = useState<'projects' | 'settings' | 'workspace'>('projects')
  const [selectedWorkspace, setSelectedWorkspace] = useState<model.Workspace | null>(null)
  const [selectedGroup, setSelectedGroup] = useState('')
  const [search, setSearch] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showSaveWorkspaceDialog, setShowSaveWorkspaceDialog] = useState(false)
  const [editingProject, setEditingProject] = useState<model.Project | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; project: model.Project } | null>(null)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const { groups, add: addGroup } = useGroups()
  const { projects, statuses, start, remove, add, edit, refresh } = useProjects(selectedGroup)
  const { workspaces, refresh: refreshWorkspaces, save: saveWorkspace, restore: restoreWorkspace, remove: removeWorkspace } = useWorkspaces()

  const filteredProjects = projects.filter(p =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.label.toLowerCase().includes(search.toLowerCase()) ||
    p.path.toLowerCase().includes(search.toLowerCase())
  )

  const handleRemove = (id: string) => {
    setConfirmRemoveId(id)
  }

  const doRemove = async () => {
    if (confirmRemoveId) {
      await remove(confirmRemoveId)
      setConfirmRemoveId(null)
    }
  }

  const handleContextMenu = useCallback((e: React.MouseEvent, project: model.Project) => {
    setContextMenu({ x: e.clientX, y: e.clientY, project })
  }, [])

  const closeContextMenu = useCallback(() => setContextMenu(null), [])

  const buildContextMenuItems = (): ContextMenuItem[] => {
    if (!contextMenu) return []
    const p = contextMenu.project
    const status = statuses.get(p.id)
    const items: ContextMenuItem[] = []

    if (status?.running) {
      items.push({
        label: t.focus,
        onClick: async () => { await FocusProject(status.pid, p.label); closeContextMenu() },
      })
      items.push({
        label: t.stop,
        onClick: async () => { await StopProject(status.pid); closeContextMenu() },
      })
    } else {
      items.push({
        label: t.start,
        onClick: () => { start(p.id); closeContextMenu() },
      })
    }

    items.push({
      label: t.edit,
      onClick: () => { setEditingProject(p); closeContextMenu() },
    })

    if (groups.length > 0) {
      items.push({
        label: t.moveToGroup,
        onClick: () => {},
        children: [
          { label: t.noGroup, onClick: async () => { await edit(p.id, undefined, undefined, undefined, ''); closeContextMenu() } },
          ...groups.map(g => ({
            label: g,
            onClick: async () => { await edit(p.id, undefined, undefined, undefined, g); closeContextMenu() },
          })),
        ],
      })
    }

    items.push({
      label: t.del,
      danger: true,
      onClick: () => { handleRemove(p.id); closeContextMenu() },
    })

    return items
  }

  const handleSelectGroup = (group: string) => {
    setSelectedGroup(group)
    setSelectedWorkspace(null)
    setCurrentPage('projects')
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        groups={groups}
        selectedGroup={selectedGroup}
        onSelectGroup={handleSelectGroup}
        onAddGroup={addGroup}
        workspaces={workspaces}
        selectedWorkspace={selectedWorkspace}
        onSelectWorkspace={(ws) => { setSelectedWorkspace(ws); setCurrentPage('workspace') }}
        onSaveWorkspace={() => setShowSaveWorkspaceDialog(true)}
        onRemoveWorkspace={removeWorkspace}
        onSettings={() => setCurrentPage('settings')}
        settingsActive={currentPage === 'settings'}
      />
      {currentPage === 'settings' ? (
        <SettingsPage onBack={() => setCurrentPage('projects')} />
      ) : currentPage === 'workspace' && selectedWorkspace ? (
        <WorkspacePage
          workspace={selectedWorkspace}
          onBack={() => { setSelectedWorkspace(null); setCurrentPage('projects') }}
          onUpdated={refreshWorkspaces}
        />
      ) : (
      <main className="flex-1 p-6 overflow-auto bg-surface-bg">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-heading font-bold text-content">
            {selectedGroup || t.allProjects}
            <span className="ml-2 text-sm font-normal text-content-muted font-body">
              ({filteredProjects.length})
            </span>
          </h1>
          <div className="flex items-center gap-2">
            <SearchBar value={search} onChange={setSearch} />
            <button
              onClick={() => setShowImportDialog(true)}
              className="px-5 py-2.5 text-sm font-semibold text-white rounded-pill bg-gradient-to-br from-secondary to-[#93C5A9] shadow-[0_4px_14px_rgba(129,178,154,0.3)] hover:translate-y-[-2px] hover:shadow-[0_8px_24px_rgba(129,178,154,0.4)] transition-all duration-300"
            >
              {t.import}
            </button>
            <button
              onClick={() => setShowAddDialog(true)}
              className="px-5 py-2.5 text-sm font-semibold text-white rounded-pill bg-gradient-to-br from-primary to-[#E8917A] shadow-[0_4px_14px_rgba(224,122,95,0.3)] hover:translate-y-[-2px] hover:shadow-[0_8px_24px_rgba(224,122,95,0.4)] transition-all duration-300"
            >
              {t.addProject}
            </button>
          </div>
        </div>
        {filteredProjects.length === 0 ? (
          <p className="text-content-muted">{t.noProjectsFound}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                status={statuses.get(p.id)}
                onStart={start}
                onFocus={(pid, label) => FocusProject(pid, label)}
                onEdit={setEditingProject}
                onRemove={handleRemove}
                onContextMenu={handleContextMenu}
              />
            ))}
          </div>
        )}
      </main>
      )}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={buildContextMenuItems()}
          onClose={closeContextMenu}
        />
      )}
      {showAddDialog && (
        <AddProjectDialog
          groups={groups}
          onAdd={add}
          onClose={() => setShowAddDialog(false)}
        />
      )}
      {editingProject && (
        <EditProjectDialog
          project={editingProject}
          groups={groups}
          onEdit={edit}
          onClose={() => setEditingProject(null)}
        />
      )}
      {showImportDialog && (
        <ImportDialog
          onImported={refresh}
          onClose={() => setShowImportDialog(false)}
        />
      )}
      {showSaveWorkspaceDialog && (
        <SaveWorkspaceDialog
          onSave={saveWorkspace}
          onClose={() => setShowSaveWorkspaceDialog(false)}
        />
      )}
      {confirmRemoveId && (
        <ConfirmDialog
          message={t.removeConfirm}
          onConfirm={doRemove}
          onCancel={() => setConfirmRemoveId(null)}
        />
      )}
    </div>
  )
}

export default App
