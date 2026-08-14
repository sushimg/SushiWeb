export function Field({
  label,
  name,
  type = 'text',
  required = true,
  autoComplete,
  error,
  describedBy,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  autoComplete?: string
  /** Bu alana özgü hata metni varsa, ekran okuyucunun alanla birlikte
   *  duyurabilmesi için `aria-invalid`/`aria-describedby` bağlanır. */
  error?: string
  /** Hata metni başka bir yerde (örn. formun altında) gösteriliyorsa,
   *  onun id'sini burada vererek aynı bağlamayı kurabilirsin. */
  describedBy?: string
}) {
  const errorId = error ? `${name}-error` : undefined
  const finalDescribedBy = errorId ?? describedBy

  return (
    <label className="block space-y-1">
      <span className="text-sm text-neutral-400">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={finalDescribedBy}
        className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2
                   outline-none focus:border-neutral-400"
      />
      {error && (
        <span id={errorId} role="alert" className="block text-xs text-red-400">
          {error}
        </span>
      )}
    </label>
  )
}
