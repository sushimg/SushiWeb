import { useEffect } from 'react'
import { m } from 'framer-motion'
import { fadeUp, viewportOnce, DUR } from '../lib/motion'
import { Container } from '../components/ui/Container'
import { SocialLinks } from '../components/ui/SocialLinks'
import { useI18n } from '../i18n'

declare global {
  interface Window {
    instgrm?: { Embeds?: { process: () => void } }
  }
}

// Which Instagram post/reel to embed. Paste an individual post/reel permalink
// here — e.g. 'https://www.instagram.com/p/XXXXXXXXXXX/'. NOTE: Instagram's
// embed script only renders individual posts/reels, NOT profile URLs, so the
// profile fallback below won't render until you replace it with a real post.
const INSTAGRAM_PERMALINK = 'https://www.instagram.com/sushisystems/'

const EMBED_SRC = 'https://www.instagram.com/embed.js'

// React renders <script> tags into the DOM but never executes them, so the
// embed script has to be injected imperatively. Once it's loaded, process()
// turns every .instagram-media blockquote into a rendered iframe.
function useInstagramEmbed() {
  useEffect(() => {
    const render = () => window.instgrm?.Embeds?.process()

    if (window.instgrm) {
      render()
      return
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${EMBED_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', render)
      return () => existing.removeEventListener('load', render)
    }

    const script = document.createElement('script')
    script.src = EMBED_SRC
    script.async = true
    script.addEventListener('load', render)
    document.body.appendChild(script)
  }, [])
}

export function LatestNews() {
  const { t } = useI18n()
  useInstagramEmbed()

  return (
    /* gray bg — section 4 */
    <section style={{ background: 'var(--bg-alt)' }}>
      <Container className="py-32">
        <m.div
          variants={fadeUp} initial="hidden" whileInView="show"
          viewport={viewportOnce}
          transition={{ duration: DUR.slow }}
          className="flex flex-col items-center text-center gap-8"
        >
          <h2
            className="font-display font-black leading-none"
            style={{ fontSize: 'clamp(2.5rem, 7vw, 6rem)', color: 'var(--text)' }}
          >
            {t.news.title}
          </h2>
          <p className="text-base max-w-md" style={{ color: 'var(--text-muted)' }}>
            {t.news.subtitle}
          </p>

          <SocialLinks className="flex items-center gap-3 flex-wrap justify-center" />

          {/* Instagram embed — the iframe is cross-origin so its inner colors
              can't follow the theme; we frame it instead so the fixed white
              card blends into both light and dark backgrounds */}
          <div className="w-full flex justify-center mt-2">
            <div
              className="rounded-2xl shadow-md"
              style={{ background: '#fff', padding: 8, border: '1px solid var(--border)' }}
            >
              <blockquote
                className="instagram-media"
                data-instgrm-permalink={INSTAGRAM_PERMALINK}
                data-instgrm-version="14"
                style={{ background: '#fff', margin: 0, maxWidth: 328, width: '100%', minWidth: 0 }}
              />
            </div>
          </div>
        </m.div>
      </Container>
    </section>
  )
}
