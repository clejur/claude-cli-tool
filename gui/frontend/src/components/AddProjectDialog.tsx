import { useState } from 'react'
import { useT } from '../i18n/context'

interface AddProjectDialogProps {
  groups: string[]
  onAdd: (name: string, label: string, path: string, command: string, group: string) => Promise<void>
  onClose: () => void
}

export function AddProjectDialog({ groups, onAdd, onClose }: AddProjectDialogProps) {
  const t = useT()
  const [name, setName] = useState('')
  const [label, setLabel] = useState('')
  const [path, setPath] = useState('')
  const [command, setCommand] = useState('claude')
  const [group, setGroup] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !path) {
      setError(t.namePathRequired)
      return
    }
    try {
      await onAdd(name, label || name, path, command, group)
      onClose()
    } catch (err: any) {
      setError(err.toString())
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-[420px] border border-gray-600">
        <h2 className="text-lg font-bold mb-4">{t.addProjectTitle}</h2>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">{t.nameRequired}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
              placeholder={t.namePlaceholder}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">{t.tabLabel}</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
              placeholder={t.labelPlaceholder}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">{t.pathRequired}</label>
            <input
              value={path}
              onChange={(e) => setPath(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
              placeholder={t.pathPlaceholder}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">{t.command}</label>
            <input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">{t.group}</label>
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
            >
              <option value="">{t.noGroup}</option>
              {groups.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white">
              {t.cancel}
            </button>
            <button type="submit" className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded">
              {t.add}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
