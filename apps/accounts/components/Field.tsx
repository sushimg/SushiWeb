export function Field({
  label,
  name,
  type = 'text',
  required = true,
  autoComplete,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  autoComplete?: string
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm text-neutral-400">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2
                   outline-none focus:border-neutral-400"
      />
    </label>
  )
}
