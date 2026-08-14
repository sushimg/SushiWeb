import { PageTransition } from '../components/ui/PageTransition'
import { Hero } from '../sections/Hero'
import { AboutSnippet } from '../sections/AboutSnippet'
import { Projects } from '../sections/Projects'
import { FAQ } from '../sections/FAQ'
import { LatestNews } from '../sections/LatestNews'
import { Contact } from '../sections/Contact'
import { useI18n } from '../i18n'
import { useDocumentTitle } from '../lib/useDocumentTitle'

// Section bg alternation:
// Hero     — full bleed image
// About    — white  (--bg)
// Projects — gray   (--bg-alt)
// FAQ      — white  (--bg)
// News     — gray   (--bg-alt)
// Contact  — white  (--bg)

export function Home() {
  const { t } = useI18n()
  useDocumentTitle(t.pageTitles.home)
  return (
    <PageTransition>
      <main>
        <Hero />
        <AboutSnippet />
        <Projects />
        <FAQ />
        <LatestNews />
        <Contact />
      </main>
    </PageTransition>
  )
}
