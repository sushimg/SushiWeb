import { domAnimation } from 'framer-motion'
import type { Variants } from 'framer-motion'

// LazyMotion feature bundle. `domAnimation` (~17kb) covers animate / exit /
// whileInView / variants + tap·hover·focus gestures — everything this site
// uses. We deliberately avoid `domMax` (drag + layout, ~25kb) since nothing
// here drags or layout-animates, keeping the runtime and memory footprint
// as small as possible.
export const features = domAnimation

// A single easing + duration scale shared site-wide so every reveal,
// transition and hover feels identical ("rafine ve aynı"). easeOutQuint —
// quick to start, soft to land, reads smoothly even on 120Hz displays.
export const EASE = [0.22, 1, 0.36, 1] as const

export const DUR = {
  fast: 0.3,
  base: 0.45,
  slow: 0.6,
} as const

// Reveal once, a touch before the element fully enters the viewport.
export const viewportOnce = { once: true, margin: '-60px' } as const

// Shared reveal variants — referenced (not re-allocated) by every section,
// so scroll reveals across the whole site move as one.
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
}

export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
}

export const fadeRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  show: { opacity: 1, x: 0 },
}
