import { useState, useEffect } from 'react'
import { useT } from '../i18n/context'
import { ListProjects, GetStatus } from '../../wailsjs/go/main/App'
import { model } from '../../wailsjs/go/models'

interface SaveWorkspaceDialogProps {
  onSave: (name: string, projectNames: string[]) => Promise<void>
  onClose: () => void
}

interface RunningProject {
  name: string
  label: string
  path: string
}

export function SaveWorkspaceDialog({ onSave, onClose }: SaveWorkspaceDialogProps) {
  const t = useT()
  const [runningProjects, setRunningProjects] = useState<RunningProject[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const [allProjects, statusList] = await Promise.all([ListProjects(''), GetStatus()])
        const runningIds = new Set<string>()
        if (statusList) {
          for (const s of statusList) {
            if (s.running) runningIds.add(s.id)
          }
        }
        const running = (allProjects || []).filter((p: model.Project) => runningIds.has(p.id))
        setRunningProjects(running.map((p: model.Project) => ({ name: p.name, label: p.label, path: p.path })))
        setSelected(new Set(running.map((p: model.Project) => p.name)))
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
    if (selected.size === runningProjects.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(runningProjects.map(p => p.name)))
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-[460px] border border-gray-600">
        <h2 className="text-lg font-bold mb-4">{t.saveWorkspaceTitle}</h2>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">{t.workspaceName}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
            placeholder={t.workspaceNamePlaceholder}
            autoFocus
          />
        </div>
        {loading ? (
          <p className="text-gray-400 text-sm">{t.scanning}</p>
        ) : runningProjects.length === 0 ? (
          <p className="text-gray-500 text-sm">{t.noRunningProjects}</p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">{t.selectProjects}</span>
              <button onClick={toggleAll} className="text-xs text-blue-400 hover:text-blue-300">
                {selected.size === runningProjects.length ? t.deselectAll : t.selectAll}
              </button>
            </div>
            <div className="space-y-1 max-h-48 overflow-auto">
              {runningProjects.map(p => (
                <label
                  key={p.name}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-700 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(p.name)}
                    onChange={() => toggle(p.name)}
                    className="rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{p.label}</div>
                    <div className="text-xs text-gray-500 truncate">{p.path}</div>
                  </div>
                </label>
              ))}
            </div>
          </>
        )}
        <div className="flex justify-end gap-2 pt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white">
            {t.cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={selected.size === 0 || !name.trim()}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  )
}
