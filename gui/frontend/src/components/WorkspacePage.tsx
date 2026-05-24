import { useState, useEffect, useCallback } from 'react'
import { model } from '../../wailsjs/go/models'
import { ListProjects, GetStatus, StartProjects, ListWorkspaces } from '../../wailsjs/go/main/App'
import { EditWorkspaceDialog } from './EditWorkspaceDialog'
import { useT } from '../i18n/context'
import type { ProjectStatus } from '../types'

interface WorkspacePageProps {
  workspace: model.Workspace
  onBack: () => void
  onUpdated: () => void
}

export function WorkspacePage({ workspace, onBack, onUpdated }: WorkspacePageProps) {
  const t = useT()
  const [currentWs, setCurrentWs] = useState(workspace)
  const [projects, setProjects] = useState<model.Project[]>([])
  const [statuses, setStatuses] = useState<Map<string, ProjectStatus>>(new Map())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showEditDialog, setShowEditDialog] = useState(false)

  const loadProjects = useCallback(async (ws: model.Workspace) => {
    const [allProjects, statusList] = await Promise.all([ListProjects(''), GetStatus()])
    const wsProjectIds = new Set(ws.projectIds || [])
    const wsProjects = (allProjects || []).filter((p: model.Project) => wsProjectIds.has(p.id))
    setProjects(wsProjects)
    setSelected(new Set(wsProjects.map((p: model.Project) => p.name)))

    const map = new Map<string, ProjectStatus>()
    if (statusList) {
      for (const s of statusList) {
        map.set(s.id, s as unknown as ProjectStatus)
      }
    }
    setStatuses(map)
  }, [])

  useEffect(() => {
    setCurrentWs(workspace)
    loadProjects(workspace)
  }, [workspace, loadProjects])

  useEffect(() => {
    const interval = setInterval(async () => {
      const statusList = await GetStatus()
      const map = new Map<string, ProjectStatus>()
      if (statusList) {
        for (const s of statusList) {
          map.set(s.id, s as unknown as ProjectStatus)
        }
      }
      setStatuses(map)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const toggle = (name: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === projects.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(projects.map(p => p.name)))
    }
  }

  const handleStartSelected = async () => {
    const toStart = projects
      .filter(p => selected.has(p.name) && !statuses.get(p.id)?.running)
      .map(p => p.name)
    if (toStart.length > 0) {
      await StartProjects(toStart)
    }
  }

  const handleEditSaved = async () => {
    onUpdated()
    const wsList = await ListWorkspaces()
    const updated = (wsList || []).find((ws: model.Workspace) => ws.id === currentWs.id)
    if (updated) {
      setCurrentWs(updated)
      loadProjects(updated)
    }
  }

  const notRunningSelected = projects.filter(p => selected.has(p.name) && !statuses.get(p.id)?.running)

  return (
    <div className="flex-1 p-6 overflow-auto bg-surface-bg">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="mb-4 px-4 py-1.5 text-xs font-medium text-content-muted border border-border rounded-pill hover:border-primary hover:text-primary transition-all duration-200"
        >
          {t.backToProjects}
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-heading font-bold text-content">
            {currentWs.name}
            <span className="ml-2 text-sm font-normal text-content-muted font-body">
              ({projects.length})
            </span>
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditDialog(true)}
              className="px-4 py-2 text-sm text-content-muted border-2 border-border rounded-pill hover:border-primary hover:text-primary font-medium transition-all duration-200"
            >
              {t.editWorkspace}
            </button>
            <button
              onClick={toggleAll}
              className="px-4 py-2 text-sm text-content-muted border-2 border-border rounded-pill hover:border-primary hover:text-primary font-medium transition-all duration-200"
            >
              {selected.size === projects.length ? t.deselectAll : t.selectAll}
            </button>
            <button
              onClick={handleStartSelected}
              disabled={notRunningSelected.length === 0}
              className="px-5 py-2.5 text-sm font-semibold text-white rounded-pill bg-gradient-to-br from-primary to-[#E8917A] shadow-[0_4px_14px_rgba(224,122,95,0.3)] hover:translate-y-[-2px] hover:shadow-[0_8px_24px_rgba(224,122,95,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {notRunningSelected.length === projects.length
                ? t.startAll
                : t.startSelected(notRunningSelected.length)}
            </button>
          </div>
        </div>
      </div>
      {projects.length === 0 ? (
        <p className="text-content-muted text-sm">{t.noProjectsFound}</p>
      ) : (
        <div className="space-y-2">
          {projects.map(p => {
            const status = statuses.get(p.id)
            const isRunning = status?.running
            return (
              <label
                key={p.id}
                className="flex items-center gap-4 bg-white border border-border rounded-card px-5 py-4 cursor-pointer hover:shadow-md transition-all"
              >
                <input
                  type="checkbox"
                  checked={selected.has(p.name)}
                  onChange={() => toggle(p.name)}
                  className="rounded accent-primary w-4 h-4 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-content truncate">{p.label || p.name}</div>
                  <div className="text-xs text-content-subtle truncate">{p.path}</div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
                  isRunning
                    ? 'bg-green-50 text-green-600'
                    : 'bg-gray-100 text-content-subtle'
                }`}>
                  {isRunning ? t.running : t.stopped}
                </span>
              </label>
            )
          })}
        </div>
      )}
      {showEditDialog && (
        <EditWorkspaceDialog
          workspace={currentWs}
          onSaved={handleEditSaved}
          onClose={() => setShowEditDialog(false)}
        />
      )}
    </div>
  )
}
