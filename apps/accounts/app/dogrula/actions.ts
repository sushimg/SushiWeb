'use server'

import { verifyEmail } from '@sushi/identity-core'
import { deps } from '@/lib/deps'

export interface VerifyState {
  checked: boolean
  verified: boolean
}

/**
 * Token'ı harcayan tek yer. Bir GET render'ında değil, kullanıcının
 * "Hesabımı doğrula" düğmesine bastığı bir form gönderiminde çalışır —
 * bağlantıyı önceden getiren posta tarayıcıları ve önizleme botları buraya
 * hiç ulaşmaz, sadece onay sayfasını görürler.
 */
export async function verifyEmailAction(
  _previous: VerifyState,
  form: FormData,
): Promise<VerifyState> {
  const token = String(form.get('token') ?? '')
  const verified = token ? await verifyEmail(token, deps) : false
  return { checked: true, verified }
}
