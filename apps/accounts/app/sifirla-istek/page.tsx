'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { Field } from '@/components/Field'
import { SubmitButton } from '@/components/SubmitButton'
import { requestResetAction, type RequestState } from './actions'

const INITIAL: RequestState = { message: null, done: false }

export default function RequestResetPage() {
  const [state, action] = useActionState(requestResetAction, INITIAL)

  if (state.done) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Bağlantıyı gönderdik</h1>
        <p className="text-neutral-400">{state.message}</p>
        <Link href="/giris" className="underline">Giriş sayfasına dön</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Parolamı unuttum</h1>
      <p className="text-neutral-400">
        E-posta adresini yaz, sıfırlama bağlantısı gönderelim.
      </p>

      <form action={action} className="space-y-4">
        <Field label="E-posta" name="email" type="email" autoComplete="email" />
        <SubmitButton>Bağlantı gönder</SubmitButton>
      </form>

      <Link href="/giris" className="text-sm underline text-neutral-400">
        Giriş sayfasına dön
      </Link>
    </div>
  )
}
