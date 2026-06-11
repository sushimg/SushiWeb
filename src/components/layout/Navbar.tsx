import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, m } from 'framer-motion'
import { useTheme } from '../../lib/useTheme'
import { useI18n, LOCALES, LOCALE_LABELS } from '../../i18n'
import { Container } from '../ui/Container'
import { Logo } from './Logo'
import { navLinks } from './navLinks'

function LocaleSwitcher() {
  const { locale, setLocale } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div ref={ref} className="relative" aria-label="Language">
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1 font-grotesk text-xs font-medium transition-colors duration-100 cursor-pointer"
        style={{ color: 'var(--text-muted)' }}
      >
        {LOCALE_LABELS[locale]}
        <svg
          width="9"
          height="9"
          viewBox="0 0 10 10"
          fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        >
          <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <m.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            role="listbox"
            className="absolute right-0 mt-2 min-w-[4.5rem] py-1 rounded-lg overflow-hidden z-50"
            style={{ background: 'var(--nav-bg)', border: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}
          >
            {LOCALES.map(l => (
              <li key={l}>
                <button
                  onClick={() => {
                    setLocale(l)
                    setOpen(false)
                  }}
                  role="option"
                  aria-selected={l === locale}
                  className="w-full text-left px-3 py-1.5 font-display text-xs font-medium transition-colors cursor-pointer"
                  style={{ color: l === locale ? 'var(--accent)' : 'var(--text-muted)' }}
                >
                  {LOCALE_LABELS[l]}
                </button>
              </li>
            ))}
          </m.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

function ThemeToggle() {
  const { dark, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="w-8 h-8 flex items-center justify-center transition-colors cursor-pointer"
      style={{ color: 'var(--text-muted)' }}
    >
      {dark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}

export function Navbar() {
  const { pathname } = useLocation()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  return (
    <>
      <header
        className="fixed top-0 inset-x-0 z-50 backdrop-blur-md h-24"
        style={{ background: 'var(--nav-bg)' }}
      >
        <Container className="relative flex items-center md:justify-between h-24">
          <Logo size={64} onClick={() => setOpen(false)} className="mx-auto md:mx-0" />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map(({ key, to }) => {
              const active = pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  className="relative flex flex-col items-center gap-1 text-sm font-medium transition-colors"
                  style={{ color: active ? 'var(--accent)' : 'var(--text)' }}
                >
                  {t.nav[key]}
                  {active && (
                    <span className="absolute -bottom-1 w-1 h-1 rounded-full" style={{ background: 'var(--accent)' }} />
                  )}
                </Link>
              )
            })}
            <LocaleSwitcher />
            <ThemeToggle />
          </nav>

          {/* Mobile menu toggle — absolute so the logo stays centered */}
          <button
            onClick={() => setOpen(o => !o)}
            aria-label="Toggle menu"
            className="md:hidden absolute right-8 top-1/2 -translate-y-1/2 w-8 h-8 flex flex-col items-center justify-center gap-1.5"
          >
            <span
              className="block w-5 h-0.5 transition-all duration-200 origin-center"
              style={{
                background: 'var(--text)',
                transform: open ? 'translateY(8px) rotate(45deg)' : 'none',
              }}
            />
            <span
              className="block w-5 h-0.5 transition-all duration-200"
              style={{
                background: 'var(--text)',
                opacity: open ? 0 : 1,
              }}
            />
            <span
              className="block w-5 h-0.5 transition-all duration-200 origin-center"
              style={{
                background: 'var(--text)',
                transform: open ? 'translateY(-8px) rotate(-45deg)' : 'none',
              }}
            />
          </button>
        </Container>
      </header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {open && (
          <m.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-24 z-40 md:hidden py-6"
            style={{ background: 'var(--nav-bg)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}
          >
            <Container className="flex flex-col items-center gap-5 text-center">
              {navLinks.map(({ key, to }) => {
                const active = pathname === to
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setOpen(false)}
                    className="text-lg font-medium transition-colors"
                    style={{ color: active ? 'var(--accent)' : 'var(--text)' }}
                  >
                    {t.nav[key]}
                  </Link>
                )
              })}
              <div className="flex items-center gap-4 pt-2">
                <LocaleSwitcher />
                <ThemeToggle />
              </div>
            </Container>
          </m.div>
        )}
      </AnimatePresence>
    </>
  )
}
