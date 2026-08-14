interface Props {
  children: string
  small?: boolean
  className?: string
}

export function SectionTitle({ children, small = false, className = '' }: Props) {
  return (
    <h2
      className={`flex items-center gap-3 font-display font-semibold ${small ? 'text-xl md:text-2xl' : 'text-3xl md:text-4xl'} ${className}`}
      style={{ color: 'var(--text)' }}
    >
      <span
        className="shrink-0 rounded-full"
        style={{ width: '0.5em', height: '0.5em', background: 'var(--accent)' }}
      />
      {children}
    </h2>
  )
}
