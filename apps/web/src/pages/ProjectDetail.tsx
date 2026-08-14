import { m } from 'framer-motion'
import { useParams } from 'react-router-dom'
import { fadeUp, DUR } from '../lib/motion'
import { PageTransition } from '../components/ui/PageTransition'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { ProjectImage } from '../sections/project/ProjectImage'
import { ProseSection } from '../sections/project/ProseSection'
import { ProjectGallery } from '../sections/project/ProjectGallery'
import { OutcomeSection } from '../sections/project/OutcomeSection'
import { OtherProjects } from '../sections/project/OtherProjects'
import { getProject } from '../data/projects'
import { useI18n } from '../i18n'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { NotFound } from './NotFound'

export function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { t } = useI18n()
  const project = getProject(slug)
  const copy = project && t.projects.items[project.id]
  useDocumentTitle(project?.name ?? t.pageTitles.notFound)

  // unknown slug — reuse the 404 page
  if (!project || !copy) return <NotFound />

  // first work image sits between Overview and About; the rest form the gallery
  const [lead, ...rest] = project.gallery ?? []

  return (
    <PageTransition>
      <main style={{ background: 'var(--bg)' }}>
        <Container className="pt-16 md:pt-24">
          {/* header: back button, title, info · year */}
          <m.header
            variants={fadeUp} initial="hidden" animate="show"
            transition={{ duration: DUR.slow }}
          >
            <Button as="link" to="/projects" variant="ghost" size="sm">
              ← {t.projectPage.back}
            </Button>
            <h1
              className="font-display font-semibold leading-tight mt-6"
              style={{ fontSize: 'clamp(2.25rem, 5vw, 3.75rem)', color: 'var(--text)' }}
            >
              {project.name}
            </h1>
            <p className="mt-3 text-sm md:text-base" style={{ color: 'var(--text-muted)' }}>
              {copy.info}
              {copy.year && <span> · {copy.year}</span>}
            </p>
          </m.header>
        </Container>

        {/* hero image — full-width banner, like the About-page banners */}
        {project.detailImage && (
          <div className="mt-10">
            <ProjectImage src={project.detailImage} alt={project.name} priority fullBleed />
          </div>
        )}

        <Container className="pb-16 md:pb-24">
          <div className="mt-16 flex flex-col gap-16">
            <ProseSection title={t.projectPage.overview} paragraphs={copy.overview} />

            {/* lead work image between Overview and About */}
            {lead && <ProjectImage src={lead} alt={`${project.name} — 1`} />}

            <ProseSection title={t.projectPage.about} paragraphs={copy.about} />

            <ProjectGallery images={rest} name={project.name} />

            {copy.outcome && (
              <OutcomeSection title={t.projectPage.outcome} outcome={copy.outcome} />
            )}

            <OtherProjects currentId={project.id} />
          </div>
        </Container>
      </main>
    </PageTransition>
  )
}
