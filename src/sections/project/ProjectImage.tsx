import { m } from 'framer-motion'
import { viewportOnce, DUR } from '../../lib/motion'

interface Props {
  src: string
  alt: string
  /** larger cap for the hero image at the top of the page */
  priority?: boolean
  /**
   * Edge-to-edge banner: full viewport width with a capped height and no
   * rounding, matching the About-page banners. Used for the hero image at the
   * top of a project detail page (rendered outside the page container).
   */
  fullBleed?: boolean
}

/** A single full-width image with a fade-in-on-scroll reveal. */
export function ProjectImage({ src, alt, priority = false, fullBleed = false }: Props) {
  const className = fullBleed ? 'w-full object-cover' : 'w-full rounded-xl object-cover'

  return (
    <m.img
      initial={{ opacity: 0, y: priority ? 0 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: DUR.slow }}
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      className={className}
      style={fullBleed ? { maxHeight: 480 } : undefined}
    />
  )
}
