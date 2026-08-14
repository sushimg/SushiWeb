import { useState, type FormEvent } from 'react'
import { Button } from './Button'
import { useI18n } from '../../i18n'
import { site } from '../../data/site'
import { submitContact } from '../../lib/forms'

type Status = 'idle' | 'sending' | 'success' | 'error'

const fieldStyle = {
  background: 'var(--bg-card)',
  color: 'var(--text)',
  border: '1px solid var(--border)',
}

/**
 * Tagline → contact form → "or just email us" fallback. Shared by the home
 * Contact section and the standalone /contact page; the parent renders the
 * "CONTACT US" heading above it.
 */
export function ContactForm() {
  const { t } = useI18n()
  const [status, setStatus] = useState<Status>('idle')

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === 'sending') return
    const form = e.currentTarget
    const data = new FormData(form)
    setStatus('sending')
    try {
      await submitContact({
        name: String(data.get('name') ?? ''),
        email: String(data.get('email') ?? ''),
        message: String(data.get('message') ?? ''),
      })
      setStatus('success')
      form.reset()
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="w-full max-w-xl flex flex-col items-center gap-14">
      <p className="text-base md:text-lg max-w-lg" style={{ color: 'var(--text-muted)' }}>
        {t.contact.tagline}
      </p>

      <form onSubmit={onSubmit} className="w-full flex flex-col gap-4 text-left">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            name="name"
            required
            autoComplete="name"
            placeholder={t.contact.form.name}
            className="flex-1 rounded-lg px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors"
            style={fieldStyle}
          />
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={t.contact.form.email}
            className="flex-1 rounded-lg px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors"
            style={fieldStyle}
          />
        </div>
        <textarea
          name="message"
          required
          rows={5}
          placeholder={t.contact.form.message}
          className="rounded-lg px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors resize-y"
          style={fieldStyle}
        />
        <div className="flex flex-col items-center gap-4">
          <Button type="submit" variant="primary" disabled={status === 'sending'}>
            {status === 'sending' ? t.contact.form.sending : t.contact.form.submit}
          </Button>
          {status === 'success' && (
            <span className="text-sm" style={{ color: 'var(--accent)' }}>
              {t.contact.form.success}
            </span>
          )}
          {status === 'error' && (
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {t.contact.form.error}
            </span>
          )}
        </div>
      </form>

      {/* "or just email us" divider + direct mailto fallback */}
      <div className="flex items-center gap-4 w-full max-w-sm">
        <span className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        <span className="text-sm uppercase tracking-wide whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
          {t.contact.orMail}
        </span>
        <span className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>
      <a
        href={`mailto:${site.email}`}
        className="font-display text-2xl md:text-3xl font-bold transition-opacity hover:opacity-70"
        style={{ color: 'var(--accent)' }}
      >
        {site.email}
      </a>
    </div>
  )
}
