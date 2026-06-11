import { useSyncExternalStore } from 'react'

// Module-level store so every component sees the same theme state.
// (Separate useState per hook call meant e.g. the Logo never re-rendered
// when the Navbar toggled the theme.)

function initialDark(): boolean {
  if (typeof window === 'undefined') return false
  const stored = localStorage.getItem('theme')
  if (stored) return stored === 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

let dark = initialDark()
if (typeof document !== 'undefined') {
  document.documentElement.classList.toggle('dark', dark)
}

const listeners = new Set<() => void>()

function setDark(value: boolean) {
  dark = value
  document.documentElement.classList.toggle('dark', value)
  localStorage.setItem('theme', value ? 'dark' : 'light')
  listeners.forEach(l => l())
}

/**
 * Theme flip with a fast circular reveal expanding from the click position
 * (View Transitions API; falls back to an instant switch).
 */
function toggleTheme(event?: { clientX: number; clientY: number }) {
  const next = !dark

  if (!document.startViewTransition) {
    setDark(next)
    return
  }

  const x = event?.clientX ?? window.innerWidth / 2
  const y = event?.clientY ?? 0
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  )

  const transition = document.startViewTransition(() => setDark(next))
  transition.ready.then(() => {
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${radius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 400,
        easing: 'cubic-bezier(0.2, 0, 0, 1)',
        pseudoElement: '::view-transition-new(root)',
      },
    )
  })
}

export function useTheme() {
  const isDark = useSyncExternalStore(
    cb => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => dark,
  )
  return { dark: isDark, toggle: toggleTheme }
}
