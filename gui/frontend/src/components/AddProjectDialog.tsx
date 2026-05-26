import { useState } from 'react'
import { SelectDirectory } from '../../wailsjs/go/main/App'
import { useT, useTranslateError } from '../i18n/context'
import { Select } from './Select'

const commandPresets = [
  { flag: '--continue', label: '--continue' },
  { flag: '--resume', label: '--resume' },
  { flag: '--fork-session', label: '--fork-session' },
]

interface AddProjectDialogProps {
  groups: string[]
  defaultGroup?: string
  onAdd: (label: string, path: string, command: string, group: string) => Promise<void>
  onClose: () => void
}

export function AddProjectDialog({ groups, defaultGroup = '', onAdd, onClose }: AddProjectDialogProps) {
  const t = useT()
  const translateError = useTranslateError()
  const [label, setLabel] = useState('')
  const [path, setPath] = useState('')
  const [command, setCommand] = useState('claude --continue')
  const [group, setGroup] = useState(defaultGroup)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!label || !path) {
      setError(t.namePathRequired)
      return
    }
    try {
      await onAdd(label, path, command, group)
      onClose()
    } catch (err: any) {
      setError(translateError(err))
    }
  }

  const inputClass = "w-full border-2 border-border rounded-input px-4 py-3 text-sm bg-white focus:outline-none focus:border-primary focus:shadow-[0_0_0_4px_rgba(224,122,95,0.1)] transition-all placeholder:text-content-subtle"

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-card p-6 w-[420px] border border-border shadow-xl">
        <h2 className="text-lg font-bold font-heading mb-4">{t.addProjectTitle}</h2>
        {error && <p className="text-red-500 text-sm mb-3 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-content-muted font-medium mb-1">{t.group}</label>
            <Select
              value={group}
              onChange={setGroup}
              options={[
                { value: '', label: t.noGroup },
                ...groups.map(g => ({ value: g, label: g })),
              ]}
            />
          </div>
          <div>
            <label className="block text-sm text-content-muted font-medium mb-1">{t.pathRequired}</label>
            <div className="flex gap-2">
              <input value={path} onChange={(e) => setPath(e.target.value)} className={inputClass + " flex-1"} placeholder={t.pathPlaceholder} />
              <button
                type="button"
                onClick={async () => {
                  const p = await SelectDirectory()
                  if (p) {
                    setPath(p)
                    const folderName = p.replace(/[\\/]+$/, '').split(/[\\/]/).pop() || ''
                    if (!label) setLabel(folderName)
                  }
                }}
                className="px-3 py-2 text-sm text-content-muted border-2 border-border rounded-input hover:border-primary hover:text-primary transition-all shrink-0"
                title={t.browse}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-content-muted font-medium mb-1">{t.nameRequired}</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} className={inputClass} placeholder={t.namePlaceholder} />
          </div>
          <div>
            <label className="block text-sm text-content-muted font-medium mb-1">{t.command}</label>
            <input value={command} onChange={(e) => setCommand(e.target.value)} className={inputClass} />
            <div className="flex flex-wrap gap-2 mt-2">
              {commandPresets.map(p => {
                const active = command.includes(p.flag)
                return (
                  <button
                    key={p.flag}
                    type="button"
                    onClick={() => {
                      if (active) {
                        setCommand(command.replace(` ${p.flag}`, '').replace(p.flag, '').trim())
                      } else {
                        setCommand((command + ' ' + p.flag).trim())
                      }
                    }}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                      active
                        ? 'bg-primary/10 border-primary text-primary font-semibold'
                        : 'border-border text-content-muted hover:border-primary hover:text-primary'
                    }`}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-semibold text-content-muted border-2 border-border rounded-pill hover:border-primary hover:text-primary transition-all duration-200">
              {t.cancel}
            </button>
            <button type="submit" className="px-5 py-2 text-sm text-white font-semibold rounded-pill bg-gradient-to-br from-primary to-[#E8917A] shadow-[0_4px_14px_rgba(224,122,95,0.3)] hover:translate-y-[-2px] hover:shadow-[0_8px_24px_rgba(224,122,95,0.4)] transition-all duration-300">
              {t.add}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
