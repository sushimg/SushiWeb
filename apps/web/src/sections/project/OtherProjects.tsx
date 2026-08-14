import { m } from 'framer-motion'
import { fadeUp, viewportOnce, DUR } from '../../lib/motion'
import { SectionTitle } from '../../components/ui/SectionTitle'
import { ProjectCard } from '../../components/ui/ProjectCard'
import { projects } from '../../data/projects'
import { useI18n } from '../../i18n'

/** "Other Projects" — every project except the one currently being viewed. */
export function OtherProjects({ currentId }: { currentId: string }) {
  const { t } = useI18n()
  const others = projects.filter(p => p.id !== currentId)
  if (!others.length) return null

  return (
    <section>
      <m.div
        variants={fadeUp} initial="hidden" whileInView="show"
        viewport={viewportOnce}
        transition={{ duration: DUR.base }}
        className="mb-8"
      >
        <SectionTitle>{t.projectPage.other}</SectionTitle>
      </m.div>
      <div className="grid gap-6 md:grid-cols-2">
        {others.map((p, i) => (
          <ProjectCard key={p.id} project={p} info={t.projects.items[p.id]?.info ?? ''} index={i} />
        ))}
      </div>
    </section>
  )
}
