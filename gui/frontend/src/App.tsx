import { useState, useCallback } from 'react'
import { Sidebar } from './components/Sidebar'
import { SearchBar } from './components/SearchBar'
import { ProjectCard } from './components/ProjectCard'
import { ContextMenu, type ContextMenuItem } from './components/ContextMenu'
import { AddProjectDialog } from './components/AddProjectDialog'
import { EditProjectDialog } from './components/EditProjectDialog'
import { ImportDialog } from './components/ImportDialog'
import { SaveWorkspaceDialog } from './components/SaveWorkspaceDialog'
import { WorkspaceMenu } from './components/WorkspaceMenu'
import { useGroups } from './hooks/useGroups'
import { useProjects } from './hooks/useProjects'
import { useWorkspaces } from './hooks/useWorkspaces'
import { useT } from './i18n/context'
import { StopProject } from '../wailsjs/go/main/App'
import { model } from '../wailsjs/go/models'

function App() {
  const t = useT()
  const [selectedGroup, setSelectedGroup] = useState('')
  const [search, setSearch] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showSaveWorkspaceDialog, setShowSaveWorkspaceDialog] = useState(false)
  const [editingProject, setEditingProject] = useState<model.Project | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; project: model.Project } | null>(null)
  const { groups, add: addGroup } = useGroups()
  const { projects, statuses, start, remove, add, edit, refresh } = useProjects(selectedGroup)
  const { workspaces, save: saveWorkspace, restore: restoreWorkspace, remove: removeWorkspace } = useWorkspaces()

  const filteredProjects = projects.filter(p =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.label.toLowerCase().includes(search.toLowerCase()) ||
    p.path.toLowerCase().includes(search.toLowerCase())
  )

  const handleRemove = async (id: string) => {
    if (confirm(t.removeConfirm)) {
      await remove(id)
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

  return (
    <div className="flex h-screen">
      <Sidebar
        groups={groups}
        selectedGroup={selectedGroup}
        onSelectGroup={setSelectedGroup}
        onAddGroup={addGroup}
      />
      <main className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">
            {selectedGroup || t.allProjects}
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({filteredProjects.length})
            </span>
          </h1>
          <div className="flex items-center gap-2">
            <SearchBar value={search} onChange={setSearch} />
            <WorkspaceMenu
              workspaces={workspaces}
              onRestore={restoreWorkspace}
              onSave={() => setShowSaveWorkspaceDialog(true)}
              onRemove={removeWorkspace}
            />
            <button
              onClick={() => setShowImportDialog(true)}
              className="px-4 py-2 text-sm bg-green-700 hover:bg-green-600 rounded"
            >
              {t.import}
            </button>
            <button
              onClick={() => setShowAddDialog(true)}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded"
            >
              {t.addProject}
            </button>
          </div>
        </div>
        {filteredProjects.length === 0 ? (
          <p className="text-gray-500">{t.noProjectsFound}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                status={statuses.get(p.id)}
                onStart={start}
                onEdit={setEditingProject}
                onRemove={handleRemove}
                onContextMenu={handleContextMenu}
              />
            ))}
          </div>
        )}
      </main>
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
    </div>
  )
}

export default App
