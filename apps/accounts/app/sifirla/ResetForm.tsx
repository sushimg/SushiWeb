'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { Field } from '@/components/Field'
import { SubmitButton } from '@/components/SubmitButton'
import { completeResetAction, type CompleteState } from './actions'

const INITIAL: CompleteState = { message: null, done: false }

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState(completeResetAction, INITIAL)

  if (state.done) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Parolan değişti</h1>
        <p className="text-neutral-400">{state.message}</p>
        <Link href="/giris" className="underline">Giriş yap</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Yeni parola belirle</h1>

      <form action={action} className="space-y-4">
        {/* Token gizli alanda taşınıyor: sayfa URL'sinde zaten var, ama
            formun kendi verisiyle gelmesi action'ı URL'den bağımsız kılar. */}
        <input type="hidden" name="token" value={token} />
        <Field
          label="Yeni parola"
          name="password"
          type="password"
          autoComplete="new-password"
        />
        <p className="text-xs text-neutral-500">
          En az 12 karakter. Bilinen sızıntılarda geçen parolalar kabul edilmez.
        </p>
        <SubmitButton>Parolayı değiştir</SubmitButton>
      </form>

      {state.message && (
        <p role="alert" className="text-sm text-red-400">{state.message}</p>
      )}
    </div>
  )
}
