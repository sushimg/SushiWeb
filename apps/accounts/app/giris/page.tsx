'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { Field } from '@/components/Field'
import { SubmitButton } from '@/components/SubmitButton'
import { loginAction, type LoginState } from './actions'

const INITIAL: LoginState = { message: null }

export default function LoginPage() {
  const [state, action] = useActionState(loginAction, INITIAL)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Giriş yap</h1>

      <form action={action} className="space-y-4">
        <Field label="E-posta" name="email" type="email" autoComplete="email" />
        <Field
          label="Parola"
          name="password"
          type="password"
          autoComplete="current-password"
        />
        <SubmitButton>Giriş yap</SubmitButton>
      </form>

      {state.message && (
        <p role="alert" className="text-sm text-red-400">{state.message}</p>
      )}

      <div className="flex justify-between text-sm text-neutral-400">
        <Link href="/kayit" className="underline">Hesap oluştur</Link>
        <Link href="/sifirla-istek" className="underline">Parolamı unuttum</Link>
      </div>
    </div>
  )
}
