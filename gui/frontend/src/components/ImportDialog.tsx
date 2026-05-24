import { useState, useEffect } from 'react'
import { DetectUnregistered, AddProject } from '../../wailsjs/go/main/App'
import { useT } from '../i18n/context'

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

  const handleImport = async () => {
    setImporting(true)
    setError('')
    const usedNames = new Set<string>()
    for (const idx of selected) {
      const proc = processes[idx]
      let name = baseName(proc.cwd)
      if (usedNames.has(name.toLowerCase())) {
        name = name + '-2'
      }
      try {
        await AddProject(name, name, proc.cwd, 'claude', '')
        usedNames.add(name.toLowerCase())
      } catch (err: any) {
        setError(`Failed to import ${proc.cwd}: ${err}`)
        setImporting(false)
        return
      }
    }
    onImported()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-[520px] border border-gray-600">
        <h2 className="text-lg font-bold mb-4">{t.importTitle}</h2>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        {loading ? (
          <p className="text-gray-400 text-sm">{t.scanning}</p>
        ) : processes.length === 0 ? (
          <p className="text-gray-500 text-sm">{t.noUnregistered}</p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">{t.processesFound(processes.length)}</span>
              <button onClick={toggleAll} className="text-xs text-blue-400 hover:text-blue-300">
                {selected.size === processes.length ? t.deselectAll : t.selectAll}
              </button>
            </div>
            <div className="space-y-1 max-h-64 overflow-auto">
              {processes.map((proc, i) => (
                <label
                  key={i}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-700 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(i)}
                    onChange={() => toggle(i)}
                    className="rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{proc.cwd}</div>
                    <div className="text-xs text-gray-500">PID {proc.pid}</div>
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
          {processes.length > 0 && (
            <button
              onClick={handleImport}
              disabled={selected.size === 0 || importing}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? t.importing : t.importCount(selected.size)}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
