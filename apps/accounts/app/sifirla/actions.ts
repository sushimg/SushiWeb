'use server'

import { PASSWORD_MIN_BYTES, completePasswordReset } from '@sushi/identity-core'
import { headers } from 'next/headers'
import { clientIp } from '@/lib/client-ip'
import { deps } from '@/lib/deps'
import { uniform } from '@/lib/uniform'

export interface CompleteState {
  message: string | null
  done: boolean
}

const RATE_LIMITED = 'Çok fazla deneme yapıldı. Biraz sonra tekrar dene.'

const MESSAGES: Record<string, string> = {
  'invalid-token': 'Bu bağlantı geçersiz ya da süresi dolmuş. Yeniden iste.',
  'too-short': `Parola en az ${PASSWORD_MIN_BYTES} karakter olmalı.`,
  'too-long': 'Parola çok uzun.',
  breached: 'Bu parola bilinen veri sızıntılarında geçiyor. Başka bir tane seç.',
}

/**
 * Bu action IP başına sınırlı olmalı: `completePasswordReset` sızıntı
 * kontrolü için dışarıya (HIBP) bir istek yapar VE bunu token'ı harcamadan
 * ÖNCE yapar. Sınır olmasaydı, geçersiz bir token'la bile tekrar tekrar
 * çağıran biri hem üçüncü taraf servisine ücretsiz bir vekil hem de veritabanına
 * sınırsız yazma elde ederdi. Diğer üç action'la aynı desen: `clientIp()` +
 * `deps.limiter.hit()` + reddedilince `uniform()` ile aynı süre harcanır.
 */
export async function completeResetAction(
  _previous: CompleteState,
  form: FormData,
): Promise<CompleteState> {
  const token = String(form.get('token') ?? '')
  const password = String(form.get('password') ?? '')

  const ip = clientIp(await headers())
  // ip === null: başlıklar yoksa IP kovasını atla, bkz. lib/client-ip.ts.
  const allowed = ip === null
    || (await deps.limiter.hit('reset-complete', ip, 20, 60 * 60 * 1000, deps.now()))
  if (!allowed) {
    await uniform(Promise.resolve())
    return { message: RATE_LIMITED, done: false }
  }

  const result = await uniform(completePasswordReset(token, password, deps))

  if (result === 'ok') {
    return {
      message: 'Parolan değiştirildi ve tüm oturumların kapatıldı. Şimdi giriş yapabilirsin.',
      done: true,
    }
  }

  return { message: MESSAGES[result] ?? 'Parola değiştirilemedi.', done: false }
}
