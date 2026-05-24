import { createContext, useContext, useState, type ReactNode } from 'react'
import { locales, type Locale, type Translations } from './locales'

interface I18nContextValue {
  lang: Locale
  setLang: (lang: Locale) => void
  t: Translations
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'en',
  setLang: () => {},
  t: locales.en,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Locale>(() => {
    const stored = localStorage.getItem('lang')
    return (stored === 'zh' || stored === 'en') ? stored : 'en'
  })

  const setLang = (l: Locale) => {
    setLangState(l)
    localStorage.setItem('lang', l)
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t: locales[lang] }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useT() {
  return useContext(I18nContext).t
}

export function useLang() {
  const { lang, setLang } = useContext(I18nContext)
  return { lang, setLang }
}

export function useTranslateError() {
  const t = useT()
  return (err: any): string => {
    const msg = typeof err === 'string' ? err : err?.toString?.() || ''
    if (msg.includes('ERR_NAME_EXISTS|')) {
      const parts = msg.split('ERR_NAME_EXISTS|')
      return t.errNameExists(parts[1])
    }
    if (msg.includes('ERR_PATH_EXISTS|')) {
      const parts = msg.split('ERR_PATH_EXISTS|')[1].split('|')
      return t.errPathExists(parts[0], parts[1])
    }
    return msg
  }
}
