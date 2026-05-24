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
      className="fixed bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-[100] py-1 min-w-[160px]"
      style={{ left: x, top: y }}
    >
      {items.map((item, i) => (
        <div key={i} className="relative group/menu">
          <button
            onClick={item.children ? undefined : item.onClick}
            disabled={item.disabled}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed ${
              item.danger ? 'text-red-400' : 'text-gray-200'
            }`}
          >
            {item.label}
            {item.children && <span className="float-right text-gray-500">▸</span>}
          </button>
          {item.children && (
            <div className="absolute left-full top-0 hidden group-hover/menu:block bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-1 min-w-[120px]">
              {item.children.map((child, j) => (
                <button
                  key={j}
                  onClick={child.onClick}
                  className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
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
