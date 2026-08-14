'use server'

import { requestPasswordReset } from '@sushi/identity-core'
import { headers } from 'next/headers'
import { deps } from '@/lib/deps'
import { uniform } from '@/lib/uniform'

export interface RequestState {
  message: string | null
  done: boolean
}

/**
 * Cevap her zaman aynı: "adres kayıtlıysa bağlantı gönderildi."
 *
 * Hız sınırı aşıldığında bile aynı ekranı gösteriyoruz. Farklı bir mesaj
 * vermek, saldırgana hangi adreslerin sınırı tetiklediğini — dolayısıyla
 * hangilerinin ilgi çektiğini — söylerdi.
 */
const SAME_ANSWER =
  'Bu adres kayıtlıysa sıfırlama bağlantısı gönderildi. ' +
  '(Geliştirme aşamasında bağlantı sunucu konsoluna yazılıyor.)'

export async function requestResetAction(
  _previous: RequestState,
  form: FormData,
): Promise<RequestState> {
  const email = String(form.get('email') ?? '')

  const ip = (await headers()).get('x-forwarded-for') ?? 'bilinmeyen'
  const now = deps.now()
  const byIp = await deps.limiter.hit('reset-ip', ip, 10, 60 * 60 * 1000, now)
  const byEmail = await deps.limiter.hit('reset-email', email.toLowerCase(), 3, 60 * 60 * 1000, now)

  if (byIp && byEmail) {
    await uniform(requestPasswordReset(email, deps))
  } else {
    // Sınır aşıldı: iş yapılmıyor ama süre yine harcanıyor, yoksa
    // reddedilen istek hızından tanınırdı.
    await uniform(Promise.resolve())
  }

  return { message: SAME_ANSWER, done: true }
}
