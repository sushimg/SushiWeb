import { PageTransition } from '../components/ui/PageTransition'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { useI18n } from '../i18n'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export function NotFound() {
  const { t } = useI18n()
  useDocumentTitle(t.pageTitles.notFound)

  return (
    <PageTransition>
      <main className="min-h-[80vh] flex flex-col justify-center">
        <Container>
          <div className="py-24">
            <p
              className="font-display font-black leading-none mb-2"
              style={{ fontSize: 'clamp(5rem, 18vw, 14rem)', color: 'var(--accent)' }}
            >
              404
            </p>
            <h1
              className="font-display font-bold leading-none mb-8"
              style={{ fontSize: 'clamp(1.5rem, 4vw, 3rem)', color: 'var(--text)' }}
            >
              {t.notFound.title}
            </h1>
            <Button as="link" to="/" variant="ghost">
              {t.notFound.goHome}
            </Button>
          </div>
        </Container>
      </main>
    </PageTransition>
  )
}
