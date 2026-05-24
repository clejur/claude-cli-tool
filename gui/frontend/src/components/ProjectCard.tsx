import { model } from '../../wailsjs/go/models'
import { useT } from '../i18n/context'
import type { ProjectStatus } from '../types'

interface ProjectCardProps {
  project: model.Project
  status?: ProjectStatus
  onStart: (id: string) => void
  onFocus: (pid: number, label: string) => void
  onEdit: (project: model.Project) => void
  onRemove: (id: string) => void
  onContextMenu: (e: React.MouseEvent, project: model.Project) => void
}

export function ProjectCard({ project, status, onStart, onFocus, onEdit, onRemove, onContextMenu }: ProjectCardProps) {
  const t = useT()

  return (
    <div
      className="bg-surface-card rounded-card p-5 border border-border hover:translate-y-[-8px] hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(224,122,95,0.15)] transition-all duration-[400ms] cursor-pointer group"
      onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, project) }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-heading font-semibold text-content truncate">{project.label}</span>
        <div className="flex items-center gap-2">
          {status?.running && (
            <span className="text-xs font-medium text-secondary bg-secondary/10 px-2 py-0.5 rounded-pill">PID {status.pid}</span>
          )}
          <span
            className={`w-2.5 h-2.5 rounded-full ${status?.running ? 'bg-secondary animate-pulse' : 'bg-content-subtle'}`}
            title={status?.running ? t.running : t.stopped}
          />
        </div>
      </div>
      <p className="text-sm text-content-muted truncate mb-1" title={project.path}>{project.path}</p>
      <div className="flex items-center justify-between mt-4">
        <span className="text-xs font-medium text-accent bg-accent/20 px-3 py-1 rounded-pill">
          {project.group || t.ungrouped}
        </span>
        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {status?.running ? (
            <button
              onClick={() => onFocus(status.pid, project.label)}
              className="px-3 py-1.5 text-xs font-semibold text-white rounded-pill bg-gradient-to-br from-secondary to-[#93C5A9] shadow-[0_4px_14px_rgba(129,178,154,0.3)] hover:translate-y-[-2px] hover:shadow-[0_8px_24px_rgba(129,178,154,0.4)] transition-all duration-300"
              title={t.focus}
            >
              {t.focus}
            </button>
          ) : (
            <button
              onClick={() => onStart(project.id)}
              className="px-3 py-1.5 text-xs font-semibold text-white rounded-pill bg-gradient-to-br from-primary to-[#E8917A] shadow-[0_4px_14px_rgba(224,122,95,0.3)] hover:translate-y-[-2px] hover:shadow-[0_8px_24px_rgba(224,122,95,0.4)] transition-all duration-300"
              title={t.start}
            >
              {t.start}
            </button>
          )}
          <button
            onClick={() => onEdit(project)}
            className="px-3 py-1.5 text-xs font-semibold text-primary bg-white border-2 border-primary rounded-pill hover:bg-primary hover:text-white transition-all duration-300"
            title={t.edit}
          >
            {t.edit}
          </button>
          <button
            onClick={() => onRemove(project.id)}
            className="px-3 py-1.5 text-xs font-semibold text-red-500 bg-white border-2 border-red-300 rounded-pill hover:bg-red-500 hover:text-white transition-all duration-300"
            title={t.del}
          >
            {t.del}
          </button>
        </div>
      </div>
    </div>
  )
}
