import { m } from 'framer-motion'
import { fadeUp } from '../lib/motion'
import { Button } from '../components/ui/Button'
import { useI18n } from '../i18n'
import { projects } from '../data/projects'

const featured = projects.find(p => p.heroImage) ?? projects[0]

export function Hero() {
  const { t } = useI18n()
  const copy = t.projects.items[featured.id]

  return (
    <section
      className="relative w-full flex items-center justify-center overflow-hidden"
      style={{ height: 'calc(100vh - 6rem)', minHeight: 480 }}
    >
      {featured.heroImage && (
        <img
          src={featured.heroImage}
          alt={featured.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      {/* light wash so the centered dark text stays readable, as on the original */}
      <div className="absolute inset-0" style={{ background: 'var(--hero-wash)' }} />

      <div className="relative z-10 w-full px-6 text-center">
        <m.p
          variants={fadeUp} initial="hidden" animate="show"
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-base md:text-lg mb-2 font-medium tracking-wide"
          style={{ color: 'var(--text-muted)' }}
        >
          {featured.name}
        </m.p>
        <m.h1
          variants={fadeUp} initial="hidden" animate="show"
          transition={{ delay: 0.2, duration: 0.55 }}
          className="font-display font-semibold leading-tight mb-8 mx-auto"
          style={{ fontSize: 'clamp(1.75rem, 4vw, 3.5rem)', color: 'var(--text)' }}
        >
          {copy?.headline ?? featured.name}
        </m.h1>
        <m.div
          variants={fadeUp} initial="hidden" animate="show"
          transition={{ delay: 0.35, duration: 0.5 }}
          className="flex justify-center"
        >
          {featured.learnMoreUrl && (
            <Button as="link" to={featured.learnMoreUrl} variant="primary">{t.hero.learnMore}</Button>
          )}
        </m.div>
      </div>
    </section>
  )
}
