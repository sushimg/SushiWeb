'use client'

import { useFormStatus } from 'react-dom'

/**
 * Gönderim sürerken butonu kilitler. Çift gönderimi engellemenin yanı sıra,
 * kullanıcıya isteğin sürdüğünü gösterir — tekdüze yanıt süresi yüzünden
 * her istek en az birkaç yüz milisaniye sürer ve sessiz bir form donmuş
 * gibi hissedilir.
 */
export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded bg-neutral-100 px-3 py-2 font-medium text-neutral-900
                 disabled:opacity-50"
    >
      {pending ? 'Gönderiliyor…' : children}
    </button>
  )
}
