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
      className="px-4 py-2.5 text-sm border-2 border-border rounded-input w-64 bg-white focus:outline-none focus:border-primary focus:shadow-[0_0_0_4px_rgba(224,122,95,0.1)] transition-all placeholder:text-content-subtle"
    />
  )
}
