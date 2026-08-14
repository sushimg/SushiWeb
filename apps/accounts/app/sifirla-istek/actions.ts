'use server'

import { requestPasswordReset } from '@sushi/identity-core'
import { headers } from 'next/headers'
import { clientIp } from '@/lib/client-ip'
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

  const ip = clientIp(await headers())
  const now = deps.now()
  // ip === null: başlıklar yoksa IP kovasını atla, bkz. lib/client-ip.ts.
  const byIp = ip === null || (await deps.limiter.hit('reset-ip', ip, 10, 60 * 60 * 1000, now))
  // requestPasswordReset() bilinçli olarak void döner: adresin kayıtlı olup
  // olmadığını çağırana sızdırmaz. Bu yüzden e-posta kovasını yalnızca
  // gerçekten iş yapıldığında (adres varsa) harcayamayız — o bilgiyi almanın
  // tek yolu ya use-case'e dönüş değeri eklemek ya da action'dan hesap
  // deposunu sorgulamak olurdu; ikisi de bu politika kararını çekirdek
  // dışına taşırdı. Bunun yerine e-posta kovasını işten ÖNCE, sızıntıya
  // yetecek kadar sıkı ama meşru kullanıcıyı kilitlemeyecek kadar bol bir
  // sınırla harcıyoruz (saatte 10 — IP sınırıyla aynı büyüklükte).
  const byEmail = await deps.limiter.hit('reset-email', email.toLowerCase(), 10, 60 * 60 * 1000, now)

  if (byIp && byEmail) {
    await uniform(requestPasswordReset(email, deps))
  } else {
    // Sınır aşıldı: iş yapılmıyor ama süre yine harcanıyor, yoksa
    // reddedilen istek hızından tanınırdı.
    await uniform(Promise.resolve())
  }

  return { message: SAME_ANSWER, done: true }
}
