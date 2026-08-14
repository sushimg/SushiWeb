// Single source of truth for site-wide, non-translatable facts.

export const site = {
  name: 'Sushi Systems',
  email: 'hello@sushisystems.io',
} as const

export type SocialId = 'x' | 'reddit' | 'discord' | 'tiktok' | 'instagram' | 'linkedin'

export interface SocialLink {
  id: SocialId
  label: string
  href: string
}

export const socials: SocialLink[] = [
  { id: 'x', label: 'X', href: 'https://x.com/sushisystems_' },
  { id: 'reddit', label: 'Reddit', href: 'https://www.reddit.com/user/sushisystems' },
  { id: 'discord', label: 'Discord', href: 'https://discord.gg/sushisystems' },
  { id: 'tiktok', label: 'TikTok', href: 'https://tiktok.com/@sushisystems' },
  { id: 'instagram', label: 'Instagram', href: 'https://instagram.com/sushisystems' },
  { id: 'linkedin', label: 'LinkedIn', href: 'https://discord.gg/y5639YuaPh' },
]
