import { useState } from 'react'
import { model } from '../../wailsjs/go/models'
import { useT } from '../i18n/context'

interface WorkspaceMenuProps {
  workspaces: model.Workspace[]
  onRestore: (name: string) => void
  onSave: (name: string, projectNames: string[]) => void
  onRemove: (name: string) => void
  projectNames: string[]
}

export function WorkspaceMenu({ workspaces, onRestore, onSave, onRemove, projectNames }: WorkspaceMenuProps) {
  const t = useT()
  const [open, setOpen] = useState(false)

  const handleSave = () => {
    const name = prompt(t.workspaceNamePrompt)
    if (!name) return
    onSave(name, projectNames)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded border border-gray-600"
      >
        {t.workspaces}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50">
          <div className="p-2 border-b border-gray-700">
            <button
              onClick={handleSave}
              className="w-full text-left px-3 py-2 text-sm text-blue-400 hover:bg-gray-700 rounded"
            >
              {t.saveWorkspace}
            </button>
          </div>
          {workspaces.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-500">{t.noWorkspaces}</p>
          ) : (
            <div className="p-2 space-y-1">
              {workspaces.map((ws) => (
                <div key={ws.id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-700 rounded">
                  <button
                    onClick={() => { onRestore(ws.name); setOpen(false) }}
                    className="text-sm text-white flex-1 text-left"
                  >
                    {ws.name}
                    <span className="text-gray-500 ml-1">({ws.projectIds.length})</span>
                  </button>
                  <button
                    onClick={() => onRemove(ws.name)}
                    className="text-xs text-red-400 hover:text-red-300 ml-2"
                  >
                    {t.del}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
