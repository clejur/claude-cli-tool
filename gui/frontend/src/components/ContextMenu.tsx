import { useEffect } from 'react'

interface ContextMenuItem {
  label: string
  onClick: () => void
  danger?: boolean
  disabled?: boolean
  children?: ContextMenuItem[]
}

interface ContextMenuProps {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  useEffect(() => {
    const handler = () => onClose()
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [onClose])

  return (
    <div
      className="fixed bg-white border border-border rounded-2xl shadow-xl z-[100] py-1.5 min-w-[160px]"
      style={{ left: x, top: y }}
    >
      {items.map((item, i) => (
        <div key={i} className="relative group/menu">
          <button
            onClick={item.children ? undefined : item.onClick}
            disabled={item.disabled}
            className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-surface-alt disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
              item.danger ? 'text-red-500' : 'text-content'
            }`}
          >
            {item.label}
            {item.children && <span className="float-right text-content-subtle">▸</span>}
          </button>
          {item.children && (
            <div className="absolute left-full top-0 hidden group-hover/menu:block bg-white border border-border rounded-2xl shadow-xl py-1.5 min-w-[120px] max-w-[280px]">
              {item.children.map((child, j) => (
                <button
                  key={j}
                  onClick={child.onClick}
                  className="w-full text-left px-4 py-2 text-sm font-medium text-content hover:bg-surface-alt transition-colors truncate"
                >
                  {child.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export type { ContextMenuItem }
