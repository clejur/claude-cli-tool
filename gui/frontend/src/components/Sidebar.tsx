interface SidebarProps {
  groups: string[]
  selectedGroup: string
  onSelectGroup: (group: string) => void
  onAddGroup: (name: string) => void
}

export function Sidebar({ groups, selectedGroup, onSelectGroup, onAddGroup }: SidebarProps) {
  const handleAddGroup = () => {
    const name = prompt('Group name:')
    if (name) onAddGroup(name)
  }

  return (
    <aside className="w-48 bg-gray-800 p-4 border-r border-gray-700 flex flex-col">
      <h2 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">Groups</h2>
      <nav className="flex-1 space-y-1">
        <button
          onClick={() => onSelectGroup('')}
          className={`w-full text-left px-3 py-2 rounded text-sm ${
            selectedGroup === '' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
          }`}
        >
          All Projects
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
        onClick={handleAddGroup}
        className="mt-4 w-full px-3 py-2 text-sm text-gray-400 border border-dashed border-gray-600 rounded hover:border-gray-400 hover:text-gray-200"
      >
        + Add Group
      </button>
    </aside>
  )
}
