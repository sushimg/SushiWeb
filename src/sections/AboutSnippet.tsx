import { m } from 'framer-motion'
import { fadeLeft, fadeRight, viewportOnce, DUR } from '../lib/motion'
import { Button } from '../components/ui/Button'
import { SectionTitle } from '../components/ui/SectionTitle'
import { Container } from '../components/ui/Container'
import { useI18n } from '../i18n'

export function AboutSnippet() {
  const { t } = useI18n()

  return (
    /* light bg — section 1 */
    <section style={{ background: 'var(--bg)' }}>
      <Container className="py-32">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-12 md:gap-20 items-start">

          {/* Left: title */}
          <m.div
            variants={fadeLeft} initial="hidden" whileInView="show"
            viewport={viewportOnce}
            transition={{ duration: DUR.slow }}
          >
            <SectionTitle>{t.about.title}</SectionTitle>
          </m.div>

          {/* Right: content */}
          <m.div
            variants={fadeRight} initial="hidden" whileInView="show"
            viewport={viewportOnce}
            transition={{ duration: DUR.slow, delay: 0.1 }}
            className="flex flex-col gap-8"
          >
            <p className="text-lg md:text-xl leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {t.about.body}
            </p>
            <div>
              <Button as="link" to="/about" variant="ghost">{t.about.cta}</Button>
            </div>
          </m.div>

        </div>
      </Container>
    </section>
  )
}
