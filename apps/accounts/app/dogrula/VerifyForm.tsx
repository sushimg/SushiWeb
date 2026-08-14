'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { SubmitButton } from '@/components/SubmitButton'
import { verifyEmailAction, type VerifyState } from './actions'

const INITIAL: VerifyState = { checked: false, verified: false }

export function VerifyForm({ token }: { token: string }) {
  const [state, action] = useActionState(verifyEmailAction, INITIAL)

  if (state.checked) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">
          {state.verified ? 'Hesabın doğrulandı' : 'Bağlantı geçersiz'}
        </h1>
        <p className="text-neutral-400">
          {state.verified
            ? 'Artık tüm Sushi Systems ürünlerini kullanabilirsin.'
            : 'Bu bağlantının süresi dolmuş ya da daha önce kullanılmış olabilir. ' +
              'Giriş yapıp yeni bir doğrulama bağlantısı isteyebilirsin.'}
        </p>
        <Link href="/giris" className="underline">Giriş yap</Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Hesabını doğrula</h1>
      <p className="text-neutral-400">
        Bağlantı geçerliyse hesabın bu adımda doğrulanacak.
      </p>
      <form action={action}>
        <input type="hidden" name="token" value={token} />
        <SubmitButton>Hesabımı doğrula</SubmitButton>
      </form>
    </div>
  )
}
