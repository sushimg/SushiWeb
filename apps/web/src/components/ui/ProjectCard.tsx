import { m } from 'framer-motion'
import { Link } from 'react-router-dom'
import { fadeUp, viewportOnce, DUR } from '../../lib/motion'
import type { Project } from '../../data/projects'

interface Props {
  project: Project
  /** translated info line shown under the name */
  info: string
  /** stagger index for the reveal animation */
  index?: number
  /** stretch the image to fill the card height (home grid: tall left card) */
  fill?: boolean
}

/**
 * Single project card: image with a caption bar below it. Used by the home
 * Projects grid and by "Other Projects" on a detail page. Links to the
 * project's detail page when one is configured, otherwise renders inert.
 */
export function ProjectCard({ project, info, index = 0, fill = false }: Props) {
  const className = `group flex flex-col rounded-lg overflow-hidden ${fill ? 'h-full' : ''} ${
    project.learnMoreUrl ? 'cursor-pointer' : 'cursor-default'
  }`

  const motionProps = {
    variants: fadeUp,
    initial: 'hidden',
    whileInView: 'show',
    viewport: viewportOnce,
    transition: { duration: DUR.base, delay: index * 0.08 },
    className,
    style: { background: 'var(--bg)' },
  } as const

  const inner = (
    <>
      <div className={`overflow-hidden ${fill ? 'flex-1' : ''}`}>
        <img
          src={project.image}
          alt={project.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      {/* caption bar below the image, like the original cards */}
      <div className="px-5 py-4" style={{ background: 'var(--bg-caption)' }}>
        <h3 className="font-display text-lg font-semibold" style={{ color: 'var(--text)' }}>
          {project.name}
        </h3>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {info}
        </p>
      </div>
    </>
  )

  if (project.learnMoreUrl) {
    return (
      <m.div {...motionProps}>
        <Link to={project.learnMoreUrl} className="flex flex-col h-full">
          {inner}
        </Link>
      </m.div>
    )
  }
  return <m.div {...motionProps}>{inner}</m.div>
}
