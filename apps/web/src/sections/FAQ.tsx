import { m } from 'framer-motion'
import { fadeUp, viewportOnce, DUR } from '../lib/motion'
import { Accordion } from '../components/ui/Accordion'
import { SectionTitle } from '../components/ui/SectionTitle'
import { Container } from '../components/ui/Container'
import { useI18n } from '../i18n'

export function FAQ() {
  const { t } = useI18n()

  return (
    /* light bg — section 3 */
    <section style={{ background: 'var(--bg)' }}>
      <Container className="py-32">
        <m.div
          variants={fadeUp} initial="hidden" whileInView="show"
          viewport={viewportOnce}
          transition={{ duration: DUR.base }}
          className="mb-10"
        >
          <SectionTitle>{t.faq.title}</SectionTitle>
        </m.div>

        {/* original: full-width rows with centered questions */}
        <m.div
          variants={fadeUp} initial="hidden" whileInView="show"
          viewport={viewportOnce}
          transition={{ duration: DUR.base, delay: 0.1 }}
        >
          {t.faq.items.map(item => (
            <Accordion key={item.question} question={item.question} answer={item.answer} />
          ))}
        </m.div>
      </Container>
    </section>
  )
}
