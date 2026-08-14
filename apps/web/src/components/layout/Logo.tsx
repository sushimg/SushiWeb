import { Link } from 'react-router-dom'
import { useTheme } from '../../lib/useTheme'

interface Props {
  /** rendered height in px */
  size?: number
  onClick?: () => void
  className?: string
}

/**
 * Stacked logo image (sushi icon above the "SUSHI SYSTEMS" wordmark),
 * cropped from the original site asset. Dark-text variant for light mode,
 * white-text variant for dark mode.
 */
export function Logo({ size = 64, onClick, className = '' }: Props) {
  const { dark } = useTheme()
  return (
    <Link to="/" onClick={onClick} className={`inline-flex select-none ${className}`}>
      <img
        src={dark ? '/images/logo-white.png' : '/images/logo-dark.png'}
        alt="Sushi Systems"
        style={{ height: size, width: 'auto' }}
      />
    </Link>
  )
}
