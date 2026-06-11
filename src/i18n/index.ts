import { useSyncExternalStore } from 'react'
import { LOCALES, type Dictionary, type Locale } from './types'
import { en } from './locales/en'
import { no } from './locales/no'
import { tr } from './locales/tr'

export { LOCALES, LOCALE_LABELS } from './types'
export type {
  Dictionary,
  Locale,
  TitledBlock,
  FaqItem,
  ProjectCopy,
  ProjectBullet,
  ProjectOutcome,
} from './types'

/** locale registry — add a locale here and it appears in the switcher */
const dictionaries: Record<Locale, Dictionary> = { en, no, tr }

function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

function initialLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  const stored = localStorage.getItem('locale')
  if (stored && isLocale(stored)) return stored
  const browser = navigator.language.toLowerCase()
  if (browser.startsWith('tr')) return 'tr'
  // nb (bokmål) / nn (nynorsk) / no
  if (browser.startsWith('no') || browser.startsWith('nb') || browser.startsWith('nn')) return 'no'
  return 'en'
}

// Module-level store shared by every component (same pattern as useTheme).
let locale = initialLocale()
if (typeof document !== 'undefined') {
  document.documentElement.lang = locale
}

const listeners = new Set<() => void>()

export function setLocale(value: Locale) {
  if (value === locale) return
  locale = value
  document.documentElement.lang = value
  localStorage.setItem('locale', value)
  listeners.forEach(l => l())
}

export function useI18n() {
  const current = useSyncExternalStore(
    cb => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => locale,
  )
  return { locale: current, t: dictionaries[current], setLocale }
}
