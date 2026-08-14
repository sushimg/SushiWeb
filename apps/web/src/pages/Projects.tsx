import { m } from 'framer-motion'
import { fadeUp, DUR } from '../lib/motion'
import { PageTransition } from '../components/ui/PageTransition'
import { Container } from '../components/ui/Container'
import { ProjectCard } from '../components/ui/ProjectCard'
import { useI18n } from '../i18n'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { projects } from '../data/projects'

export function ProjectsPage() {
  const { t } = useI18n()
  const page = t.projectsPage
  useDocumentTitle(t.pageTitles.projects)

  return (
    <PageTransition>
      <main style={{ background: 'var(--bg)' }}>
        {/* OUR / PROJECTS hero */}
        <Container className="pt-24 pb-12 text-center">
          <m.h1
            variants={fadeUp} initial="hidden" animate="show"
            transition={{ duration: DUR.slow }}
            className="font-display font-semibold leading-tight"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', color: 'var(--text)' }}
          >
            {page.heroTop}
            <br />
            <span style={{ color: 'var(--accent)' }}>{page.heroAccent}</span>
          </m.h1>
          <m.p
            variants={fadeUp} initial="hidden" animate="show"
            transition={{ duration: DUR.slow, delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-base md:text-lg leading-relaxed"
            style={{ color: 'var(--text-muted)' }}
          >
            {page.subtitle}
          </m.p>
        </Container>

        {/* full project grid */}
        <Container className="pb-32">
          <div className="grid gap-6 md:grid-cols-2">
            {projects.map((p, i) => (
              <ProjectCard
                key={p.id}
                project={p}
                info={t.projects.items[p.id]?.info ?? ''}
                index={i}
              />
            ))}
          </div>
        </Container>
      </main>
    </PageTransition>
  )
}
