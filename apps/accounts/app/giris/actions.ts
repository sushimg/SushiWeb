'use server'

import { login } from '@sushi/identity-core'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { clientIp } from '@/lib/client-ip'
import { deps } from '@/lib/deps'
import { setSessionCookie } from '@/lib/session'
import { uniform } from '@/lib/uniform'

export interface LoginState {
  message: string | null
}

/**
 * Başarısızlık mesajı tek ve geneldir. "Böyle bir hesap yok" ile "parola
 * yanlış" arasındaki fark, saldırgana hangi adreslerin kayıtlı olduğunu
 * söyler; ayrımı kullanıcıya sunmanın getirisi bu bedeli karşılamaz.
 */
const FAILED = 'Giriş bilgileri hatalı.'

export async function loginAction(
  _previous: LoginState,
  form: FormData,
): Promise<LoginState> {
  const email = String(form.get('email') ?? '')
  const password = String(form.get('password') ?? '')

  const headerList = await headers()
  const ip = clientIp(headerList)
  const userAgent = headerList.get('user-agent')

  // İki ayrı sınır: IP başına saldırının hızını, e-posta başına tek bir
  // hesaba yoğunlaşan denemeleri kısar. Yalnızca IP sınırlansaydı, dağıtık
  // bir saldırı tek hesabı serbestçe deneyebilirdi.
  //
  // E-posta kovası yalnızca BAŞARISIZ denemelerde harcanır. Herkes herhangi
  // bir adresi forma yazabildiği için, her denemeyi sayan bir sınır, kurbanın
  // adresini bilen saldırgana onu kilitleme imkânı tanır. Bu yüzden e-posta
  // kovası isteğin BAŞINDA değil, sonucu bilindiğinde ve yalnızca sonuç
  // başarısızsa harcanır. RateLimiter portu yalnızca "say ve kontrol et"
  // birleşik bir `hit` sunar; ayrı bir "önce bak" işlemi yok, bu da isabetli
  // — çekirdeğe yeni bir port metodu eklemek burada çözülecek bir politika
  // kararını çekirdeğe taşırdı. IP kovası değişmeden, denemeden önce sayılır.
  const now = deps.now()
  // ip === null: başlıklar yoksa IP kovasını atla, bkz. lib/client-ip.ts.
  const byIp = ip === null || (await deps.limiter.hit('login-ip', ip, 20, 15 * 60 * 1000, now))
  if (!byIp) {
    await uniform(Promise.resolve())
    return { message: 'Çok fazla deneme yapıldı. Biraz sonra tekrar dene.' }
  }

  const emailKey = email.toLowerCase()
  const result = await uniform(login({ email, password, userAgent }, deps))
  if (!result) {
    const byEmail = await deps.limiter.hit('login-email', emailKey, 10, 15 * 60 * 1000, now)
    if (!byEmail) return { message: 'Çok fazla deneme yapıldı. Biraz sonra tekrar dene.' }
    return { message: FAILED }
  }

  await setSessionCookie(result.token)
  redirect('/hesap')
}
