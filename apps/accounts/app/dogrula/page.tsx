import Link from 'next/link'
import { verifyEmail } from '@sushi/identity-core'
import { deps } from '@/lib/deps'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Doğrulama bağlantısının indiği sayfa.
 *
 * Token'ı harcamak bir yan etkidir ve normalde sunucu bileşeninde yapılmaz.
 * Burada bilinçli bir istisna: kullanıcı bu sayfaya e-postadaki bağlantıya
 * tıklayarak, yani GET ile geliyor ve tıklamanın kendisi niyetin ifadesi.
 * Bir form göstermek, doğrulamayı iki adıma bölerdi ve hiçbir şey kazandırmazdı.
 */
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  const verified = token ? await verifyEmail(token, deps) : false

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">
        {verified ? 'Hesabın doğrulandı' : 'Bağlantı geçersiz'}
      </h1>
      <p className="text-neutral-400">
        {verified
          ? 'Artık tüm Sushi Systems ürünlerini kullanabilirsin.'
          : 'Bu bağlantının süresi dolmuş ya da daha önce kullanılmış olabilir. ' +
            'Giriş yapıp yeni bir doğrulama bağlantısı isteyebilirsin.'}
      </p>
      <Link href="/giris" className="underline">Giriş yap</Link>
    </div>
  )
}
