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
