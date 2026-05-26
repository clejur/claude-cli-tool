import { useState, useEffect } from 'react'
import { useT } from '../i18n/context'
import { ListProjects, GetStatus } from '../../wailsjs/go/main/App'
import { model } from '../../wailsjs/go/models'

interface SaveWorkspaceDialogProps {
  onSave: (name: string, projectNames: string[]) => Promise<void>
  onClose: () => void
}

interface ProjectItem {
  label: string
  path: string
  running: boolean
}

export function SaveWorkspaceDialog({ onSave, onClose }: SaveWorkspaceDialogProps) {
  const t = useT()
  const [allProjects, setAllProjects] = useState<ProjectItem[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const [projects, statusList] = await Promise.all([ListProjects(''), GetStatus()])
        const runningIds = new Set<string>()
        if (statusList) {
          for (const s of statusList) {
            if (s.running) runningIds.add(s.id)
          }
        }
        const items = (projects || []).map((p: model.Project) => ({
          label: p.label,
          path: p.path,
          running: runningIds.has(p.id),
        }))
        items.sort((a: ProjectItem, b: ProjectItem) => {
          if (a.running && !b.running) return -1
          if (!a.running && b.running) return 1
          return 0
        })
        setAllProjects(items)
        setSelected(new Set(items.filter((p: ProjectItem) => p.running).map((p: ProjectItem) => p.label)))
      } catch (err: any) {
        setError(err.toString())
      }
      setLoading(false)
    })()
  }, [])

  const toggle = (projectName: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(projectName)) next.delete(projectName)
      else next.add(projectName)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === allProjects.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(allProjects.map(p => p.label)))
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError(t.workspaceNameRequired)
      return
    }
    try {
      await onSave(name.trim(), Array.from(selected))
      onClose()
    } catch (err: any) {
      setError(err.toString())
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-card p-6 w-[460px] border border-border shadow-xl">
        <h2 className="text-lg font-bold font-heading mb-4">{t.saveWorkspaceTitle}</h2>
        {error && <p className="text-red-500 text-sm mb-3 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
        <div className="mb-4">
          <label className="block text-sm text-content-muted font-medium mb-1">{t.workspaceName}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border-2 border-border rounded-input px-4 py-3 text-sm bg-white focus:outline-none focus:border-primary focus:shadow-[0_0_0_4px_rgba(224,122,95,0.1)] transition-all placeholder:text-content-subtle"
            placeholder={t.workspaceNamePlaceholder}
            autoFocus
          />
        </div>
        {loading ? (
          <p className="text-content-muted text-sm">{t.scanning}</p>
        ) : allProjects.length === 0 ? (
          <p className="text-content-subtle text-sm">{t.noProjectsFound}</p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-content-muted">{t.selectProjectsForWorkspace}</span>
              <button onClick={toggleAll} className="px-3 py-1.5 text-xs font-semibold text-content-muted border border-border rounded-full hover:border-primary hover:text-primary transition-all">
                {selected.size === allProjects.length ? t.deselectAll : t.selectAll}
              </button>
            </div>
            <div className="space-y-1 max-h-56 overflow-auto">
              {allProjects.map(p => (
                <label
                  key={p.label}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-alt rounded-xl cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(p.label)}
                    onChange={() => toggle(p.label)}
                    className="rounded accent-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-content font-medium truncate">
                      {p.label}
                      {p.running && (
                        <span className="ml-2 text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full font-medium">
                          {t.running}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-content-subtle truncate">{p.path}</div>
                  </div>
                </label>
              ))}
            </div>
          </>
        )}
        <div className="flex justify-end gap-2 pt-4">
          <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-content-muted border-2 border-border rounded-pill hover:border-primary hover:text-primary transition-all duration-200">
            {t.cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={selected.size === 0 || !name.trim()}
            className="px-5 py-2 text-sm text-white font-semibold rounded-pill bg-gradient-to-br from-primary to-[#E8917A] shadow-[0_4px_14px_rgba(224,122,95,0.3)] hover:translate-y-[-2px] hover:shadow-[0_8px_24px_rgba(224,122,95,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  )
}
