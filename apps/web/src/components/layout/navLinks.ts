import type { Dictionary } from '../../i18n'

// Shared by Navbar and Footer; labels resolve through the dictionary.
export interface NavLink {
  key: keyof Dictionary['nav']
  to: string
}

export const navLinks: NavLink[] = [
  { key: 'home', to: '/' },
  { key: 'about', to: '/about' },
  { key: 'projects', to: '/projects' },
  { key: 'contact', to: '/contact' },
]
