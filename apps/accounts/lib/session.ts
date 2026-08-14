import { cookies } from 'next/headers'
import { authenticate, type Account } from '@sushi/identity-core'
import { deps } from './deps'

const COOKIE = 'sushi_session'
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60

/**
 * Cookie ayarları güvenlik açısından anlamlı:
 * - httpOnly: JavaScript okuyamaz, yani bir XSS açığı oturumu çalamaz.
 * - secure: yalnızca HTTPS üzerinden gider.
 * - sameSite lax: başka sitelerden gelen POST isteklerinde gönderilmez,
 *   ki bu CSRF'nin büyük bölümünü kapatır; normal link tıklamalarında
 *   gönderilir, böylece e-postadaki bağlantılar çalışır.
 */
export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies()
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE)
}

export async function readSessionToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(COOKIE)?.value ?? null
}

/** Oturum açmış hesabı çözer. Oturum yoksa veya geçersizse null. */
export async function currentAccount(): Promise<Account | null> {
  const token = await readSessionToken()
  if (!token) return null
  return authenticate(token, deps)
}
