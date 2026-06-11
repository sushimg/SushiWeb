import { Link } from 'react-router-dom'
import { Container } from '../ui/Container'
import { SocialLinks } from '../ui/SocialLinks'
import { Logo } from './Logo'
import { useI18n } from '../../i18n'
import { navLinks } from './navLinks'

export function Footer() {
  const { t } = useI18n()

  return (
    <footer style={{ background: 'var(--bg)' }}>
      <Container className="py-16">
        {/* Three columns matching the original: logo | nav links | social grid */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-12">
          <Logo size={80} />

          <nav className="flex flex-col gap-4">
            {navLinks.map(({ key, to }) => (
              <Link
                key={to}
                to={to}
                className="text-sm transition-opacity hover:opacity-100"
                style={{ color: 'var(--text-muted)' }}
              >
                {t.nav[key]}
              </Link>
            ))}
          </nav>

          <SocialLinks className="grid grid-cols-3 gap-3" />
        </div>

        <p className="mt-12 text-xs text-right" style={{ color: 'var(--text-muted)' }}>
          {t.footer.copyright}
        </p>
      </Container>
    </footer>
  )
}
