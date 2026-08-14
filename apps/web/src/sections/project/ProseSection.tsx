import { m } from 'framer-motion'
import type { ReactNode } from 'react'
import { fadeUp, viewportOnce, DUR } from '../../lib/motion'
import { SectionTitle } from '../../components/ui/SectionTitle'

interface Props {
  title: string
  paragraphs?: string[]
  /** extra content rendered after the paragraphs (e.g. a bullet list) */
  children?: ReactNode
}

/**
 * A headed text block: the bulleted section title followed by body
 * paragraphs. Shared by the "Overview" and "About the Project" sections.
 * Renders nothing when there is no content to show.
 */
export function ProseSection({ title, paragraphs, children }: Props) {
  if (!paragraphs?.length && !children) return null

  return (
    <m.section
      variants={fadeUp} initial="hidden" whileInView="show"
      viewport={viewportOnce}
      transition={{ duration: DUR.slow }}
    >
      <SectionTitle className="mb-6">{title}</SectionTitle>
      <div className="flex flex-col gap-4 text-base md:text-lg leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {paragraphs?.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        {children}
      </div>
    </m.section>
  )
}
