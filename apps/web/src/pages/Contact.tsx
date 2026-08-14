import { m } from 'framer-motion'
import { fadeUp, DUR } from '../lib/motion'
import { PageTransition } from '../components/ui/PageTransition'
import { Container } from '../components/ui/Container'
import { ContactForm } from '../components/ui/ContactForm'
import { useI18n } from '../i18n'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export function ContactPage() {
  const { t } = useI18n()
  useDocumentTitle(t.pageTitles.contact)

  return (
    <PageTransition>
      <main className="min-h-[80vh] flex flex-col justify-center" style={{ background: 'var(--bg)' }}>
        <Container>
          <m.div
            variants={fadeUp} initial="hidden" animate="show"
            transition={{ duration: DUR.slow }}
            className="flex flex-col items-center text-center gap-8 py-24"
          >
            <h1
              className="font-display font-black leading-none"
              style={{ fontSize: 'clamp(3rem, 8vw, 7rem)', color: 'var(--text)' }}
            >
              {t.contact.titleTop}
              <br />
              {t.contact.titleAccent}
            </h1>
            <ContactForm />
          </m.div>
        </Container>
      </main>
    </PageTransition>
  )
}
