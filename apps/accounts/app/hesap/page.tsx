import { redirect } from 'next/navigation'
import { currentAccount } from '@/lib/session'
import { logoutAction, logoutEverywhereAction } from './actions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const account = await currentAccount()
  if (!account) redirect('/giris')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Hesabın</h1>

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-neutral-400">E-posta</dt>
          <dd>{account.email}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-neutral-400">Ad</dt>
          <dd>{account.displayName ?? '—'}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-neutral-400">Doğrulama</dt>
          <dd>{account.emailVerified ? 'Doğrulandı' : 'Bekliyor'}</dd>
        </div>
      </dl>

      {!account.emailVerified && (
        <p className="rounded border border-amber-800 bg-amber-950 p-3 text-sm text-amber-200">
          E-posta adresin henüz doğrulanmadı. Doğrulanana kadar hiçbir ürüne
          erişim yetkisi alamazsın.
        </p>
      )}

      <div className="flex gap-4">
        <form action={logoutAction}>
          <button type="submit" className="underline">Çıkış yap</button>
        </form>
        <form action={logoutEverywhereAction}>
          <button type="submit" className="underline text-neutral-400">
            Tüm cihazlardan çık
          </button>
        </form>
      </div>
    </div>
  )
}
