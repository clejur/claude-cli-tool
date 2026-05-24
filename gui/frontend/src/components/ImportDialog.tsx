import { useState, useEffect } from 'react'
import { DetectUnregistered, AddProject, ListProjects } from '../../wailsjs/go/main/App'
import { useT, useTranslateError } from '../i18n/context'

interface DetectedProcess {
  pid: number
  cwd: string
}

interface ImportDialogProps {
  onImported: () => void
  onClose: () => void
}

export function ImportDialog({ onImported, onClose }: ImportDialogProps) {
  const t = useT()
  const translateError = useTranslateError()
  const [processes, setProcesses] = useState<DetectedProcess[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    DetectUnregistered().then((procs) => {
      setProcesses(procs || [])
      setLoading(false)
    }).catch((err) => {
      setError(err.toString())
      setLoading(false)
    })
  }, [])

  const toggle = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === processes.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(processes.map((_, i) => i)))
    }
  }

  const baseName = (path: string) => {
    const parts = path.replace(/\\/g, '/').split('/')
    return parts[parts.length - 1] || 'unnamed'
  }

  const dedupName = (name: string, existing: Set<string>) => {
    if (!existing.has(name.toLowerCase())) return name
    for (let i = 1; ; i++) {
      const candidate = `${name}(${i})`
      if (!existing.has(candidate.toLowerCase())) return candidate
    }
  }

  const handleImport = async () => {
    setImporting(true)
    setError('')
    const existingProjects = await ListProjects('')
    const usedNames = new Set<string>(
      (existingProjects || []).map((p: any) => (p.name as string).toLowerCase())
    )
    for (const idx of selected) {
      const proc = processes[idx]
      const name = dedupName(baseName(proc.cwd), usedNames)
      try {
        await AddProject(name, name, proc.cwd, 'claude', '')
        usedNames.add(name.toLowerCase())
      } catch (err: any) {
        setError(translateError(err))
        setImporting(false)
        return
      }
    }
    onImported()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-card p-6 w-[520px] border border-border shadow-xl">
        <h2 className="text-lg font-bold font-heading mb-4">{t.importTitle}</h2>
        {error && <p className="text-red-500 text-sm mb-3 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
        {loading ? (
          <p className="text-content-muted text-sm">{t.scanning}</p>
        ) : processes.length === 0 ? (
          <p className="text-content-subtle text-sm">{t.noUnregistered}</p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-content-muted">{t.processesFound(processes.length)}</span>
              <button onClick={toggleAll} className="text-xs text-primary hover:text-primary/80 font-medium">
                {selected.size === processes.length ? t.deselectAll : t.selectAll}
              </button>
            </div>
            <div className="space-y-1 max-h-64 overflow-auto">
              {processes.map((proc, i) => (
                <label
                  key={i}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-alt rounded-xl cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(i)}
                    onChange={() => toggle(i)}
                    className="rounded accent-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-content font-medium truncate">{proc.cwd}</div>
                    <div className="text-xs text-content-subtle">PID {proc.pid}</div>
                  </div>
                </label>
              ))}
            </div>
          </>
        )}
        <div className="flex justify-end gap-2 pt-4">
          <button onClick={onClose} className="px-5 py-2 text-sm text-content-muted hover:text-content font-medium">
            {t.cancel}
          </button>
          {processes.length > 0 && (
            <button
              onClick={handleImport}
              disabled={selected.size === 0 || importing}
              className="px-5 py-2 text-sm text-white font-semibold rounded-pill bg-gradient-to-br from-primary to-[#E8917A] shadow-[0_4px_14px_rgba(224,122,95,0.3)] hover:translate-y-[-2px] hover:shadow-[0_8px_24px_rgba(224,122,95,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {importing ? t.importing : t.importCount(selected.size)}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
