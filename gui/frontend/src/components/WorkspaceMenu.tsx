import { useState } from 'react'
import { model } from '../../wailsjs/go/models'
import { useT } from '../i18n/context'

interface WorkspaceMenuProps {
  workspaces: model.Workspace[]
  onRestore: (name: string) => void
  onSave: () => void
  onRemove: (name: string) => void
}

export function WorkspaceMenu({ workspaces, onRestore, onSave, onRemove }: WorkspaceMenuProps) {
  const t = useT()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-5 py-2.5 text-sm font-semibold text-primary bg-white border-2 border-primary rounded-pill hover:bg-primary hover:text-white transition-all duration-300"
      >
        {t.workspaces}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-border rounded-2xl shadow-xl z-50">
          <div className="p-2 border-b border-border">
            <button
              onClick={() => { onSave(); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-sm text-primary font-medium hover:bg-surface-alt rounded-xl transition-colors"
            >
              {t.saveWorkspace}
            </button>
          </div>
          {workspaces.length === 0 ? (
            <p className="px-3 py-2 text-sm text-content-subtle">{t.noWorkspaces}</p>
          ) : (
            <div className="p-2 space-y-1">
              {workspaces.map((ws) => (
                <div key={ws.id} className="flex items-center justify-between px-3 py-2 hover:bg-surface-alt rounded-xl transition-colors">
                  <button
                    onClick={() => { onRestore(ws.name); setOpen(false) }}
                    className="text-sm text-content font-medium flex-1 text-left"
                  >
                    {ws.name}
                    <span className="text-content-subtle ml-1">({ws.projectIds.length})</span>
                  </button>
                  <button
                    onClick={() => onRemove(ws.name)}
                    className="text-xs text-red-500 hover:text-red-600 font-medium ml-2"
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
