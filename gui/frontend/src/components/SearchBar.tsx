import { useT } from '../i18n/context'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const t = useT()
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={t.searchPlaceholder}
      className="px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded w-64"
    />
  )
}
