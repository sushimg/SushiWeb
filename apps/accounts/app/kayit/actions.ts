'use server'

import { register } from '@sushi/identity-core'
import { headers } from 'next/headers'
import { deps } from '@/lib/deps'
import { uniform } from '@/lib/uniform'

export const runtime = 'nodejs'

export interface RegisterState {
  message: string | null
  done: boolean
}

const MESSAGES: Record<string, string> = {
  'invalid-email': 'Bu e-posta adresi geçerli görünmüyor.',
  'too-short': 'Parola en az 12 karakter olmalı.',
  'too-long': 'Parola çok uzun.',
  breached: 'Bu parola bilinen veri sızıntılarında geçiyor. Başka bir tane seç.',
  'rate-limited': 'Çok fazla deneme yapıldı. Biraz sonra tekrar dene.',
}

/**
 * Kayıt formunu iş kuralına bağlar. Karar vermez, çevirir: FormData'yı
 * girdiye, sonucu kullanıcı mesajına.
 *
 * Başarı mesajı, adresin kayıtlı olup olmadığından bağımsız olarak aynıdır —
 * use-case'in hesap sayımı yasağı burada da korunmalı, yoksa bütün özen
 * son adımda boşa gider.
 */
export async function registerAction(
  _previous: RegisterState,
  form: FormData,
): Promise<RegisterState> {
  const email = String(form.get('email') ?? '')
  const password = String(form.get('password') ?? '')
  const displayName = String(form.get('displayName') ?? '').trim() || null

  const ip = (await headers()).get('x-forwarded-for') ?? 'bilinmeyen'
  const allowed = await deps.limiter.hit('register', ip, 5, 60 * 60 * 1000, deps.now())
  if (!allowed) return { message: MESSAGES['rate-limited']!, done: false }

  const result = await uniform(register({ email, password, displayName }, deps))

  if (result.outcome === 'rejected') {
    return { message: MESSAGES[result.reason] ?? 'Kayıt tamamlanamadı.', done: false }
  }

  return {
    message:
      'Doğrulama bağlantısı gönderildi. Gelen kutunu kontrol et. ' +
      '(Geliştirme aşamasında bağlantı sunucu konsoluna yazılıyor.)',
    done: true,
  }
}
