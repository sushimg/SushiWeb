'use server'

import { completePasswordReset } from '@sushi/identity-core'
import { deps } from '@/lib/deps'
import { uniform } from '@/lib/uniform'

export interface CompleteState {
  message: string | null
  done: boolean
}

const MESSAGES: Record<string, string> = {
  'invalid-token': 'Bu bağlantı geçersiz ya da süresi dolmuş. Yeniden iste.',
  'too-short': 'Parola en az 12 karakter olmalı.',
  'too-long': 'Parola çok uzun.',
  breached: 'Bu parola bilinen veri sızıntılarında geçiyor. Başka bir tane seç.',
}

export async function completeResetAction(
  _previous: CompleteState,
  form: FormData,
): Promise<CompleteState> {
  const token = String(form.get('token') ?? '')
  const password = String(form.get('password') ?? '')

  const result = await uniform(completePasswordReset(token, password, deps))

  if (result === 'ok') {
    return {
      message: 'Parolan değiştirildi ve tüm oturumların kapatıldı. Şimdi giriş yapabilirsin.',
      done: true,
    }
  }

  return { message: MESSAGES[result] ?? 'Parola değiştirilemedi.', done: false }
}
