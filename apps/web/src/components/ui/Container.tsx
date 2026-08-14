import type { ReactNode } from 'react'

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-5xl px-8 md:px-16 ${className}`}>
      {children}
    </div>
  )
}
