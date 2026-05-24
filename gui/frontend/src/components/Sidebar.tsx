import { useState, useEffect } from 'react'
import { useT, useLang } from '../i18n/context'
import { GetAutoStart, SetAutoStart, ExportConfig, ImportConfig } from '../../wailsjs/go/main/App'

function SettingsPanel({ lang, setLang }: { lang: string; setLang: (l: 'en' | 'zh') => void }) {
  const t = useT()
  const [autoStart, setAutoStartState] = useState(false)

  useEffect(() => {
    GetAutoStart().then(v => setAutoStartState(v))
  }, [])

  const handleAutoStart = async (checked: boolean) => {
    await SetAutoStart(checked)
    setAutoStartState(checked)
  }

  return (
    <div className="mt-2 px-3 space-y-3">
      <div>
        <label className="block text-xs text-gray-500 mb-1">{t.language}</label>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as 'en' | 'zh')}
          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200"
        >
          <option value="en">{t.langEn}</option>
          <option value="zh">{t.langZh}</option>
        </select>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={autoStart}
          onChange={(e) => handleAutoStart(e.target.checked)}
          className="rounded"
        />
        <span className="text-sm text-gray-300">{t.autoStart}</span>
      </label>
      <div className="flex gap-2">
        <button
          onClick={() => ExportConfig()}
          className="flex-1 px-2 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded text-gray-300"
        >
          {t.exportConfig}
        </button>
        <button
          onClick={() => ImportConfig()}
          className="flex-1 px-2 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded text-gray-300"
        >
          {t.importConfig}
        </button>
      </div>
    </div>
  )
}

interface SidebarProps {
  groups: string[]
  selectedGroup: string
  onSelectGroup: (group: string) => void
  onAddGroup: (name: string) => void
}

export function Sidebar({ groups, selectedGroup, onSelectGroup, onAddGroup }: SidebarProps) {
  const t = useT()
  const { lang, setLang } = useLang()
  const [showSettings, setShowSettings] = useState(false)
  const [showGroupDialog, setShowGroupDialog] = useState(false)
  const [groupName, setGroupName] = useState('')

  const handleGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = groupName.trim()
    if (trimmed) {
      onAddGroup(trimmed)
      setGroupName('')
      setShowGroupDialog(false)
    }
  }

  return (
    <>
      <aside className="w-48 bg-gray-800 p-4 border-r border-gray-700 flex flex-col">
        <h2 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">{t.groups}</h2>
        <nav className="flex-1 space-y-1">
          <button
            onClick={() => onSelectGroup('')}
            className={`w-full text-left px-3 py-2 rounded text-sm ${
              selectedGroup === '' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            {t.allProjects}
          </button>
          {groups.map((g) => (
            <button
              key={g}
              onClick={() => onSelectGroup(g)}
              className={`w-full text-left px-3 py-2 rounded text-sm ${
                selectedGroup === g ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              {g}
            </button>
          ))}
        </nav>
        <button
          onClick={() => setShowGroupDialog(true)}
          className="mt-4 w-full px-3 py-2 text-sm text-gray-400 border border-dashed border-gray-600 rounded hover:border-gray-400 hover:text-gray-200"
        >
          {t.addGroup}
        </button>
        <div className="mt-4 pt-4 border-t border-gray-700">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-full text-left px-3 py-2 rounded text-sm text-gray-400 hover:bg-gray-700 hover:text-gray-200"
          >
            ⚙ {t.settings}
          </button>
          {showSettings && (
            <SettingsPanel lang={lang} setLang={setLang} />
          )}
        </div>
      </aside>

      {showGroupDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-[340px] border border-gray-600">
            <h2 className="text-lg font-bold mb-4">{t.addGroup}</h2>
            <form onSubmit={handleGroupSubmit}>
              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                autoFocus
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm mb-4"
                placeholder={t.groupNamePrompt}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowGroupDialog(false); setGroupName('') }}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={!groupName.trim()}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.add}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
