import { ProseSection } from './ProseSection'
import type { ProjectOutcome } from '../../i18n'

interface Props {
  title: string
  outcome: ProjectOutcome
}

/** The "Outcome" section: intro paragraphs, a bullet list, then outro text. */
export function OutcomeSection({ title, outcome }: Props) {
  const { intro, bullets, outro } = outcome

  return (
    <ProseSection title={title} paragraphs={intro}>
      {bullets?.length ? (
        <ul className="flex flex-col gap-3 pl-1">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-3">
              <span
                className="mt-2.5 shrink-0 rounded-full"
                style={{ width: '0.4rem', height: '0.4rem', background: 'var(--accent)' }}
              />
              <span>
                {b.lead && (
                  <strong className="font-semibold" style={{ color: 'var(--text)' }}>
                    {b.lead}{' '}
                  </strong>
                )}
                {b.text}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {outro?.map((p, i) => (
        <p key={`outro-${i}`}>{p}</p>
      ))}
    </ProseSection>
  )
}
