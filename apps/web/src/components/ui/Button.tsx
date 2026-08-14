import { type AnchorHTMLAttributes, type ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps as RouterLinkProps } from 'react-router-dom'

type BaseProps = { variant?: 'primary' | 'ghost'; size?: 'sm' | 'md'; className?: string }
type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { as?: 'button'; href?: never; to?: never }
type AnchorProps = BaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { as: 'a'; href: string; to?: never }
// internal SPA navigation — renders a React Router <Link> (no full page reload)
type LinkProps = BaseProps & Omit<RouterLinkProps, 'className'> & { as: 'link'; to: RouterLinkProps['to'] }
type Props = ButtonProps | AnchorProps | LinkProps

// Only transform + opacity transition (both composited) at a snappy 120ms with
// an ease-out curve, so hover and the press-in land instantly and crisply.
// touch-action:manipulation kills the 300ms mobile tap delay.
const base =
  'inline-flex items-center gap-2 font-medium cursor-pointer select-none [touch-action:manipulation] ' +
  'transition-[transform,opacity] duration-[120ms] ease-out active:scale-[0.96] active:duration-75'

// original site: primary = orange bg with dark text, ghost = light gray bg with dark text
const variants = {
  primary: 'text-[#1a1b1f] hover:opacity-85',
  ghost: 'hover:opacity-70',
}

const sizes = {
  sm: 'px-4 py-2 text-sm rounded-lg',
  md: 'px-6 py-3 text-sm rounded-lg',
}

export function Button({ variant = 'ghost', size = 'md', className = '', ...rest }: Props) {
  const style = variant === 'ghost'
    ? { background: 'var(--bg-card)', color: 'var(--text)' }
    : { background: 'var(--accent)' }

  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`

  const { as: tag = 'button', ...props } = rest
  if (tag === 'link') {
    return <Link className={cls} style={style} {...(props as Omit<RouterLinkProps, 'className'>)} />
  }
  if (tag === 'a') {
    return <a className={cls} style={style} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)} />
  }
  return <button className={cls} style={style} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)} />
}
