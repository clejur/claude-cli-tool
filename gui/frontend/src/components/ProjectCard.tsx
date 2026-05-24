import { model } from '../../wailsjs/go/models'
import { useT } from '../i18n/context'
import type { ProjectStatus } from '../types'

interface ProjectCardProps {
  project: model.Project
  status?: ProjectStatus
  onStart: (id: string) => void
  onEdit: (project: model.Project) => void
  onRemove: (id: string) => void
  onContextMenu: (e: React.MouseEvent, project: model.Project) => void
}

export function ProjectCard({ project, status, onStart, onEdit, onRemove, onContextMenu }: ProjectCardProps) {
  const t = useT()

  return (
    <div
      className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-500 transition-colors group"
      onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, project) }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-white truncate">{project.label}</span>
        <div className="flex items-center gap-2">
          {status?.running && (
            <span className="text-xs text-green-400">PID {status.pid}</span>
          )}
          <span
            className={`w-2.5 h-2.5 rounded-full ${status?.running ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}
            title={status?.running ? t.running : t.stopped}
          />
        </div>
      </div>
      <p className="text-sm text-gray-400 truncate mb-1" title={project.path}>{project.path}</p>
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded">
          {project.group || t.ungrouped}
        </span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onStart(project.id)}
            className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 rounded"
            title={t.start}
          >
            {t.start}
          </button>
          <button
            onClick={() => onEdit(project)}
            className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded"
            title={t.edit}
          >
            {t.edit}
          </button>
          <button
            onClick={() => onRemove(project.id)}
            className="px-2 py-1 text-xs bg-red-700 hover:bg-red-600 rounded"
            title={t.del}
          >
            {t.del}
          </button>
        </div>
      </div>
    </div>
  )
}
