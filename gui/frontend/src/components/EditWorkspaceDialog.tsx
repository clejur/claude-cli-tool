import { useState, useEffect } from 'react'
import { useT } from '../i18n/context'
import { ListProjects, UpdateWorkspace } from '../../wailsjs/go/main/App'
import { model } from '../../wailsjs/go/models'

interface EditWorkspaceDialogProps {
  workspace: model.Workspace
  onSaved: () => void
  onClose: () => void
}

export function EditWorkspaceDialog({ workspace, onSaved, onClose }: EditWorkspaceDialogProps) {
  const t = useT()
  const [allProjects, setAllProjects] = useState<model.Project[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const projects = await ListProjects('')
        setAllProjects(projects || [])
        const wsIds = new Set(workspace.projectIds || [])
        const selectedLabels = (projects || [])
          .filter((p: model.Project) => wsIds.has(p.id))
          .map((p: model.Project) => p.label)
        setSelected(new Set(selectedLabels))
      } catch (err: any) {
        setError(err.toString())
      }
      setLoading(false)
    })()
  }, [workspace])

  const toggle = (label: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
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
    try {
      await UpdateWorkspace(workspace.name, Array.from(selected))
      onSaved()
      onClose()
    } catch (err: any) {
      setError(err.toString())
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-card p-6 w-[460px] border border-border shadow-xl">
        <h2 className="text-lg font-bold font-heading mb-4">{t.editWorkspaceTitle}: {workspace.name}</h2>
        {error && <p className="text-red-500 text-sm mb-3 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
        {loading ? (
          <p className="text-content-muted text-sm">{t.scanning}</p>
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
                  key={p.id}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-alt rounded-xl cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(p.label)}
                    onChange={() => toggle(p.label)}
                    className="rounded accent-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-content font-medium truncate">{p.label}</div>
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
            disabled={selected.size === 0}
            className="px-5 py-2 text-sm text-white font-semibold rounded-pill bg-gradient-to-br from-primary to-[#E8917A] shadow-[0_4px_14px_rgba(224,122,95,0.3)] hover:translate-y-[-2px] hover:shadow-[0_8px_24px_rgba(224,122,95,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  )
}
