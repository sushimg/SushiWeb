'use server'

import { login } from '@sushi/identity-core'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
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
  const ip = headerList.get('x-forwarded-for') ?? 'bilinmeyen'
  const userAgent = headerList.get('user-agent')

  // İki ayrı sınır: IP başına saldırının hızını, e-posta başına tek bir
  // hesaba yoğunlaşan denemeleri kısar. Yalnızca IP sınırlansaydı, dağıtık
  // bir saldırı tek hesabı serbestçe deneyebilirdi.
  const now = deps.now()
  const byIp = await deps.limiter.hit('login-ip', ip, 20, 15 * 60 * 1000, now)
  const byEmail = await deps.limiter.hit('login-email', email.toLowerCase(), 10, 15 * 60 * 1000, now)
  if (!byIp || !byEmail) {
    return { message: 'Çok fazla deneme yapıldı. Biraz sonra tekrar dene.' }
  }

  const result = await uniform(login({ email, password, userAgent }, deps))
  if (!result) return { message: FAILED }

  await setSessionCookie(result.token)
  redirect('/hesap')
}
