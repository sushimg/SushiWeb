import { m } from 'framer-motion'
import { fadeUp, viewportOnce, DUR } from '../lib/motion'
import { SectionTitle } from '../components/ui/SectionTitle'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { ProjectCard } from '../components/ui/ProjectCard'
import { useI18n } from '../i18n'
import { projects } from '../data/projects'

export function Projects() {
  const { t } = useI18n()
  const [first, ...rest] = projects

  return (
    /* gray bg — section 2 */
    <section style={{ background: 'var(--bg-alt)' }}>
      <Container className="py-32">
        <m.div
          variants={fadeUp} initial="hidden" whileInView="show"
          viewport={viewportOnce}
          transition={{ duration: DUR.base }}
          className="mb-12"
        >
          <SectionTitle>{t.projects.title}</SectionTitle>
        </m.div>

        {/* original layout: tall card left, two stacked cards right */}
        <div className="grid gap-6 md:grid-cols-2">
          <ProjectCard project={first} info={t.projects.items[first.id]?.info ?? ''} index={0} fill />
          <div className="flex flex-col gap-6">
            {rest.map((p, i) => (
              <ProjectCard key={p.id} project={p} info={t.projects.items[p.id]?.info ?? ''} index={i + 1} />
            ))}
          </div>
        </div>

        <m.div
          variants={fadeUp} initial="hidden" whileInView="show"
          viewport={viewportOnce}
          transition={{ duration: DUR.base }}
          className="mt-12 flex justify-center"
        >
          <Button as="link" to="/projects" variant="primary">{t.projects.viewAll}</Button>
        </m.div>
      </Container>
    </section>
  )
}
