import { useState, useEffect } from 'react'
import { useT, useLang } from '../i18n/context'
import { GetAutoStart, SetAutoStart, ExportConfig, ImportConfig } from '../../wailsjs/go/main/App'
import { Select } from './Select'

interface SettingsPageProps {
  onBack: () => void
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const t = useT()
  const { lang, setLang } = useLang()
  const [autoStart, setAutoStartState] = useState(false)

  useEffect(() => {
    GetAutoStart().then(v => setAutoStartState(v))
  }, [])

  const handleAutoStart = async (checked: boolean) => {
    await SetAutoStart(checked)
    setAutoStartState(checked)
  }

  return (
    <div className="flex-1 p-6 overflow-auto bg-surface-bg">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="mb-4 px-4 py-1.5 text-xs font-medium text-content-muted border border-border rounded-pill hover:border-primary hover:text-primary transition-all duration-200"
        >
          {t.backToProjects}
        </button>
        <h1 className="text-xl font-bold font-heading">{t.settings}</h1>
      </div>
      <div className="max-w-lg space-y-5">
        <div className="bg-surface-card rounded-card p-5 border border-border">
          <h2 className="text-sm font-semibold text-content-muted uppercase tracking-wider font-heading mb-4">{t.language}</h2>
          <Select
            value={lang}
            onChange={(v) => setLang(v as 'en' | 'zh')}
            options={[
              { value: 'en', label: t.langEn },
              { value: 'zh', label: t.langZh },
            ]}
          />
        </div>

        <div className="bg-surface-card rounded-card p-5 border border-border">
          <h2 className="text-sm font-semibold text-content-muted uppercase tracking-wider font-heading mb-4">{t.general}</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={autoStart}
              onChange={(e) => handleAutoStart(e.target.checked)}
              className="rounded accent-primary w-4 h-4"
            />
            <span className="text-sm text-content font-medium">{t.autoStart}</span>
          </label>
        </div>

        <div className="bg-surface-card rounded-card p-5 border border-border">
          <h2 className="text-sm font-semibold text-content-muted uppercase tracking-wider font-heading mb-4">{t.dataManagement}</h2>
          <div className="flex gap-3">
            <button
              onClick={() => ExportConfig()}
              className="flex-1 px-5 py-2.5 text-sm font-semibold text-primary bg-white border-2 border-primary rounded-pill hover:bg-primary hover:text-white transition-all duration-300"
            >
              {t.exportConfig}
            </button>
            <button
              onClick={() => ImportConfig()}
              className="flex-1 px-5 py-2.5 text-sm font-semibold text-secondary bg-white border-2 border-secondary rounded-pill hover:bg-secondary hover:text-white transition-all duration-300"
            >
              {t.importConfig}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
