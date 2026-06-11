import { m } from 'framer-motion'
import { fadeUp, fade, viewportOnce, DUR } from '../lib/motion'
import { PageTransition } from '../components/ui/PageTransition'
import { SectionTitle } from '../components/ui/SectionTitle'
import { Container } from '../components/ui/Container'
import { useI18n } from '../i18n'
import { useDocumentTitle } from '../lib/useDocumentTitle'

function IntroRow({ title, text, delay = 0 }: { title: string; text: string; delay?: number }) {
  return (
    <m.div
      variants={fadeUp} initial="hidden" whileInView="show"
      viewport={viewportOnce}
      transition={{ duration: DUR.slow, delay }}
      className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-6 md:gap-20 items-start py-12"
      style={{ borderTop: '1px solid var(--border)' }}
    >
      <SectionTitle small>{title}</SectionTitle>
      <p className="text-base md:text-lg leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {text}
      </p>
    </m.div>
  )
}

export function About() {
  const { t } = useI18n()
  const page = t.aboutPage
  useDocumentTitle(t.pageTitles.about)

  return (
    <PageTransition>
      <main style={{ background: 'var(--bg)' }}>
        {/* GET TO KNOW / US hero */}
        <Container className="pt-24 pb-16 text-center">
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
        </Container>

        {/* About Us / Our Vision / Our Mission */}
        <Container className="pb-16">
          {page.intro.map((block, i) => (
            <IntroRow key={block.title} title={block.title} text={block.text} delay={i * 0.05} />
          ))}
        </Container>

        {/* banner image — original shows a collage; using the gameplay shot until the original asset is added */}
        <m.img
          variants={fade} initial="hidden" whileInView="show"
          viewport={viewportOnce}
          transition={{ duration: DUR.slow }}
          src="/images/hero-mobilerts.png"
          alt="Sushi Systems"
          className="w-full object-cover"
          style={{ maxHeight: 480 }}
        />

        {/* Our Core */}
        <Container className="py-24">
          <SectionTitle small className="mb-16">{page.coreTitle}</SectionTitle>
          <div className="flex flex-col gap-16 max-w-3xl mx-auto text-center">
            {page.core.map(block => (
              <m.div
                key={block.title}
                variants={fadeUp} initial="hidden" whileInView="show"
                viewport={viewportOnce}
                transition={{ duration: DUR.base }}
              >
                <h3 className="font-display text-xl md:text-2xl font-semibold mb-4" style={{ color: 'var(--text)' }}>
                  {block.title}
                </h3>
                <p className="text-base md:text-lg leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {block.text}
                </p>
              </m.div>
            ))}
          </div>
        </Container>

        {/* flight sim still, as on the original page */}
        <m.img
          variants={fade} initial="hidden" whileInView="show"
          viewport={viewportOnce}
          transition={{ duration: DUR.slow }}
          src="/images/project-fs.png"
          alt="Project: FS"
          className="w-full object-cover"
          style={{ maxHeight: 480 }}
        />

        {/* Our Systems */}
        <Container className="py-24">
          <IntroRow title={page.systems.title} text={page.systems.text} />
        </Container>
      </main>
    </PageTransition>
  )
}
