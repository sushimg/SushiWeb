'use server'

import { logout } from '@sushi/identity-core'
import { redirect } from 'next/navigation'
import { deps } from '@/lib/deps'
import { clearSessionCookie, currentAccount, readSessionToken } from '@/lib/session'

export const runtime = 'nodejs'

export async function logoutAction(): Promise<void> {
  const token = await readSessionToken()
  if (token) await logout(token, deps)
  await clearSessionCookie()
  redirect('/giris')
}

/**
 * Tüm cihazlardan çıkış. Cookie'yi silmek yetmez — asıl iş oturumların
 * veritabanındaki kayıtlarını iptal etmek, çünkü çalınmış bir token'ı
 * tarayıcıdan silmek onu geçersiz kılmaz.
 */
export async function logoutEverywhereAction(): Promise<void> {
  const account = await currentAccount()
  if (account) await deps.sessions.revokeAllForAccount(account.id)
  await clearSessionCookie()
  redirect('/giris')
}
