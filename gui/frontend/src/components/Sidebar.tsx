import { useState } from 'react'
import { useT, useLang } from '../i18n/context'

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
  const [showGroupInput, setShowGroupInput] = useState(false)
  const [groupName, setGroupName] = useState('')

  const handleGroupSubmit = () => {
    const trimmed = groupName.trim()
    if (trimmed) {
      onAddGroup(trimmed)
      setGroupName('')
      setShowGroupInput(false)
    }
  }

  const handleGroupKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleGroupSubmit()
    if (e.key === 'Escape') { setShowGroupInput(false); setGroupName('') }
  }

  return (
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
      {showGroupInput ? (
        <div className="mt-4 flex gap-1">
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            onKeyDown={handleGroupKeyDown}
            autoFocus
            className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm min-w-0"
            placeholder={t.groupNamePrompt}
          />
          <button
            onClick={handleGroupSubmit}
            className="px-2 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 rounded"
          >
            OK
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowGroupInput(true)}
          className="mt-4 w-full px-3 py-2 text-sm text-gray-400 border border-dashed border-gray-600 rounded hover:border-gray-400 hover:text-gray-200"
        >
          {t.addGroup}
        </button>
      )}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-full text-left px-3 py-2 rounded text-sm text-gray-400 hover:bg-gray-700 hover:text-gray-200"
        >
          ⚙ {t.settings}
        </button>
        {showSettings && (
          <div className="mt-2 px-3 space-y-2">
            <label className="block text-xs text-gray-500">{t.language}</label>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as 'en' | 'zh')}
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200"
            >
              <option value="en">{t.langEn}</option>
              <option value="zh">{t.langZh}</option>
            </select>
          </div>
        )}
      </div>
    </aside>
  )
}
