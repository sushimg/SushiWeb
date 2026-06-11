import { useState } from 'react'

interface Props {
  question: string
  answer: string
}

export function Accordion({ question, answer }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ borderTop: '1px solid var(--border)' }}>
      {/* original rows: question centered, no visible icon */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full py-6 text-center font-display font-medium text-[var(--text)] hover:text-[var(--accent)] transition-colors duration-75 cursor-pointer"
        aria-expanded={open}
      >
        {question}
      </button>
      {/* grid-rows trick animates to the real content height — snappy in
          both directions, unlike a fixed max-height */}
      <div
        className="grid transition-[grid-template-rows] duration-150 ease-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <p className="pb-6 px-4 text-center max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {answer}
          </p>
        </div>
      </div>
    </div>
  )
}
