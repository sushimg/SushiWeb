'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { Field } from '@/components/Field'
import { SubmitButton } from '@/components/SubmitButton'
import { registerAction, type RegisterState } from './actions'

const INITIAL: RegisterState = { message: null, done: false }

export default function RegisterPage() {
  const [state, action] = useActionState(registerAction, INITIAL)

  if (state.done) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Neredeyse tamam</h1>
        <p className="text-neutral-400">{state.message}</p>
        <Link href="/giris" className="underline">Giriş sayfasına dön</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Hesap oluştur</h1>

      <form action={action} className="space-y-4">
        <Field label="Adın" name="displayName" required={false} autoComplete="name" />
        <Field label="E-posta" name="email" type="email" autoComplete="email" />
        <Field
          label="Parola"
          name="password"
          type="password"
          autoComplete="new-password"
        />
        <p className="text-xs text-neutral-500">
          En az 12 karakter. Bilinen sızıntılarda geçen parolalar kabul edilmez.
        </p>
        <SubmitButton>Hesap oluştur</SubmitButton>
      </form>

      {state.message && (
        <p role="alert" className="text-sm text-red-400">{state.message}</p>
      )}

      <p className="text-sm text-neutral-400">
        Zaten hesabın var mı? <Link href="/giris" className="underline">Giriş yap</Link>
      </p>
    </div>
  )
}
