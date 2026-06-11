import { m } from 'framer-motion'
import { fadeUp, viewportOnce, DUR } from '../lib/motion'
import { Container } from '../components/ui/Container'
import { ContactForm } from '../components/ui/ContactForm'
import { useI18n } from '../i18n'

export function Contact() {
  const { t } = useI18n()

  return (
    /* light bg — section 5 */
    <section style={{ background: 'var(--bg)' }}>
      <Container className="py-32">
        <m.div
          variants={fadeUp} initial="hidden" whileInView="show"
          viewport={viewportOnce}
          transition={{ duration: DUR.slow }}
          className="flex flex-col items-center text-center gap-8"
        >
          <h2
            className="font-display font-black leading-none"
            style={{ fontSize: 'clamp(3rem, 8vw, 7rem)', color: 'var(--text)' }}
          >
            {t.contact.titleTop}
            <br />
            {t.contact.titleAccent}
          </h2>
          <ContactForm />
        </m.div>
      </Container>
    </section>
  )
}
