import { useState } from 'react'
import { model } from '../../wailsjs/go/models'
import { useT } from '../i18n/context'

interface SidebarProps {
  groups: string[]
  selectedGroup: string
  onSelectGroup: (group: string) => void
  onAddGroup: (name: string) => void
  workspaces: model.Workspace[]
  selectedWorkspace: model.Workspace | null
  onSelectWorkspace: (ws: model.Workspace) => void
  onSaveWorkspace: () => void
  onRemoveWorkspace: (name: string) => void
  onSettings: () => void
  settingsActive: boolean
}

export function Sidebar({
  groups, selectedGroup, onSelectGroup, onAddGroup,
  workspaces, selectedWorkspace, onSelectWorkspace, onSaveWorkspace, onRemoveWorkspace,
  onSettings, settingsActive,
}: SidebarProps) {
  const t = useT()
  const [projectsOpen, setProjectsOpen] = useState(true)
  const [workspacesOpen, setWorkspacesOpen] = useState(true)
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
      <aside className="w-56 bg-white border-r border-border flex flex-col overflow-y-auto">
        {/* Projects section */}
        <div className="px-4 pt-5 pb-2">
          <button
            onClick={() => setProjectsOpen(!projectsOpen)}
            className="flex items-center gap-2 w-full"
          >
            <svg className={`w-3 h-3 text-content-muted transition-transform ${projectsOpen ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 12 12">
              <path d="M4 2l6 4-6 4V2z" />
            </svg>
            <span className="text-sm font-semibold text-content font-heading">{t.projects}</span>
            <span className="text-[11px] text-content-subtle ml-auto">{groups.length + 1}</span>
          </button>
        </div>
        {projectsOpen && (
          <nav className="px-3 pb-2 space-y-1">
            <button
              onClick={() => onSelectGroup('')}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                !settingsActive && !selectedWorkspace && selectedGroup === ''
                  ? 'bg-primary/10 text-primary'
                  : 'text-content-muted hover:bg-surface-alt hover:text-content'
              }`}
            >
              {t.allProjects}
            </button>
            {groups.map((g) => (
              <button
                key={g}
                onClick={() => onSelectGroup(g)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                  !settingsActive && !selectedWorkspace && selectedGroup === g
                    ? 'bg-primary/10 text-primary'
                    : 'text-content-muted hover:bg-surface-alt hover:text-content'
                }`}
              >
                {g}
              </button>
            ))}
            <button
              onClick={() => setShowGroupDialog(true)}
              className="w-full px-3 py-2 text-sm text-content-muted border-2 border-dashed border-border rounded-xl hover:border-primary hover:text-primary transition-all duration-200"
            >
              {t.addGroup}
            </button>
          </nav>
        )}

        {/* Divider */}
        <div className="mx-4 border-t border-border" />

        {/* Workspaces section */}
        <div className="px-4 pt-4 pb-2">
          <button
            onClick={() => setWorkspacesOpen(!workspacesOpen)}
            className="flex items-center gap-2 w-full"
          >
            <svg className={`w-3 h-3 text-content-muted transition-transform ${workspacesOpen ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 12 12">
              <path d="M4 2l6 4-6 4V2z" />
            </svg>
            <span className="text-sm font-semibold text-content font-heading">{t.workspaces}</span>
            <span className="text-[11px] text-content-subtle ml-auto">{workspaces.length}</span>
          </button>
        </div>
        {workspacesOpen && (
          <nav className="px-3 pb-2 space-y-1">
            {workspaces.length === 0 ? (
              <p className="px-3 py-2 text-xs text-content-subtle italic">{t.noWorkspaces}</p>
            ) : (
              workspaces.map((ws) => (
                <div key={ws.id} className={`flex items-center group rounded-xl transition-colors ${
                  selectedWorkspace?.id === ws.id ? 'bg-primary/10' : 'hover:bg-surface-alt'
                }`}>
                  <button
                    onClick={() => onSelectWorkspace(ws)}
                    className={`flex-1 text-left px-3 py-2 text-xs font-medium transition-all duration-200 ${
                      selectedWorkspace?.id === ws.id ? 'text-primary' : 'text-content-muted hover:text-content'
                    }`}
                  >
                    {ws.name}
                    <span className="text-content-subtle ml-1">({ws.projectIds.length})</span>
                  </button>
                  <button
                    onClick={() => onRemoveWorkspace(ws.name)}
                    className="opacity-0 group-hover:opacity-100 px-2 text-sm text-red-400 hover:text-red-500 transition-all"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
            <button
              onClick={onSaveWorkspace}
              className="w-full px-3 py-2 text-sm text-content-muted border-2 border-dashed border-border rounded-xl hover:border-secondary hover:text-secondary transition-all duration-200"
            >
              {t.saveWorkspace}
            </button>
          </nav>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Settings */}
        <div className="p-3 border-t border-border">
          <button
            onClick={onSettings}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              settingsActive
                ? 'bg-primary/10 text-primary shadow-sm'
                : 'text-content-muted hover:bg-surface-alt hover:text-content'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {t.settings}
          </button>
        </div>
      </aside>

      {showGroupDialog && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-card p-6 w-[340px] border border-border shadow-xl">
            <h2 className="text-lg font-bold font-heading mb-4">{t.addGroupTitle}</h2>
            <form onSubmit={handleGroupSubmit}>
              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                autoFocus
                className="w-full border-2 border-border rounded-input px-4 py-3 text-sm mb-4 focus:outline-none focus:border-primary focus:shadow-[0_0_0_4px_rgba(224,122,95,0.1)] transition-all"
                placeholder={t.groupNamePrompt}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowGroupDialog(false); setGroupName('') }}
                  className="px-5 py-2 text-sm text-content-muted hover:text-content font-medium"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={!groupName.trim()}
                  className="px-5 py-2 text-sm text-white font-semibold rounded-pill bg-gradient-to-br from-primary to-[#E8917A] shadow-[0_4px_14px_rgba(224,122,95,0.3)] hover:translate-y-[-2px] hover:shadow-[0_8px_24px_rgba(224,122,95,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
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
