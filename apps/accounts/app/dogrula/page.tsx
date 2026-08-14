import Link from 'next/link'
import { VerifyForm } from './VerifyForm'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Doğrulama bağlantısının indiği sayfa.
 *
 * Token'ı harcamak bir yan etkidir; bu GET render'ında YAPILMAZ. Kurumsal
 * posta tarayıcıları ve önizleme botları (Outlook Safe Links, Slack
 * unfurling) e-postadaki bağlantıyı kullanıcıdan önce getirir — token burada
 * harcansaydı, hiç tıklamamış meşru bir kullanıcı "Bağlantı geçersiz"
 * ekranıyla karşılaşırdı. Bunun yerine sayfa yalnızca bir onay gösterir;
 * token'ı harcayan asıl işlem, kullanıcının bilinçli tıkladığı bir Server
 * Action'a (`verifyEmailAction`) bırakılır.
 */
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Bağlantı geçersiz</h1>
        <p className="text-neutral-400">
          Bu bağlantının süresi dolmuş ya da daha önce kullanılmış olabilir.
          Giriş yapıp yeni bir doğrulama bağlantısı isteyebilirsin.
        </p>
        <Link href="/giris" className="underline">Giriş yap</Link>
      </div>
    )
  }

  return <VerifyForm token={token} />
}
