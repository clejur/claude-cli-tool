import { useState, useEffect } from 'react'
import { useT, useLang } from '../i18n/context'
import { GetAutoStart, SetAutoStart, GetCloseToTray, SetCloseToTray, ExportConfig, ImportConfig } from '../../wailsjs/go/main/App'

interface SettingsPageProps {
  onBack: () => void
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const t = useT()
  const { lang, setLang } = useLang()
  const [autoStart, setAutoStartState] = useState(false)
  const [closeToTray, setCloseToTrayState] = useState(true)

  useEffect(() => {
    GetAutoStart().then(v => setAutoStartState(v))
    GetCloseToTray().then(v => setCloseToTrayState(v))
  }, [])

  const handleAutoStart = async (checked: boolean) => {
    await SetAutoStart(checked)
    setAutoStartState(checked)
  }

  const handleCloseToTray = async (checked: boolean) => {
    await SetCloseToTray(checked)
    setCloseToTrayState(checked)
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
          <div className="flex rounded-pill overflow-hidden border border-border">
            <button
              onClick={() => setLang('zh')}
              className={`flex-1 px-5 py-2 text-sm font-semibold transition-all duration-200 ${
                lang === 'zh'
                  ? 'bg-primary text-white'
                  : 'bg-white text-content-muted hover:text-content'
              }`}
            >
              中文
            </button>
            <button
              onClick={() => setLang('en')}
              className={`flex-1 px-5 py-2 text-sm font-semibold transition-all duration-200 ${
                lang === 'en'
                  ? 'bg-primary text-white'
                  : 'bg-white text-content-muted hover:text-content'
              }`}
            >
              English
            </button>
          </div>
        </div>

        <div className="bg-surface-card rounded-card p-5 border border-border">
          <h2 className="text-sm font-semibold text-content-muted uppercase tracking-wider font-heading mb-4">{t.general}</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoStart}
                onChange={(e) => handleAutoStart(e.target.checked)}
                className="rounded accent-primary w-4 h-4"
              />
              <span className="text-sm text-content font-medium">{t.autoStart}</span>
            </label>

            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm text-content font-medium">{t.closeToTray}</div>
                <div className="text-xs text-content-muted mt-0.5">{t.closeToTrayDesc}</div>
              </div>
              <button
                onClick={() => handleCloseToTray(!closeToTray)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                  closeToTray ? 'bg-secondary' : 'bg-gray-300'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  closeToTray ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
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
