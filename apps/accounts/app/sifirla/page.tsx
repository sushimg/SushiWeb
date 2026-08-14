import Link from 'next/link'
import { ResetForm } from './ResetForm'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Bağlantı eksik</h1>
        <p className="text-neutral-400">
          Bu sayfaya e-postandaki bağlantıyla gelmen gerekiyor.
        </p>
        <Link href="/sifirla-istek" className="underline">Yeni bağlantı iste</Link>
      </div>
    )
  }

  return <ResetForm token={token} />
}
