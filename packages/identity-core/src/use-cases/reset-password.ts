import { checkPassword, type BreachChecker, type PolicyViolation } from '../password-policy'
import { generateToken, hashToken } from '../tokens'
import { normalizeEmail } from '../email-address'
import type { AccountStore } from '../ports/account-store'
import type { EmailSender } from '../ports/email-sender'
import type { PasswordHasher } from '../ports/password-hasher'
import type { SessionStore } from '../ports/session-store'
import type { VerificationStore } from '../ports/verification-store'

/** Sıfırlama linki 1 saat geçerli — doğrulamadan kısa, çünkü riski yüksek. */
const RESET_TTL_MS = 60 * 60 * 1000

export interface ResetDeps {
  accounts: AccountStore
  hasher: PasswordHasher
  breaches: BreachChecker
  email: EmailSender
  resets: VerificationStore
  sessions: SessionStore
  resetUrl: (token: string) => string
  now: () => Date
}

/**
 * Sıfırlama linki ister.
 *
 * Adres kayıtlı değilse hiçbir şey yapmaz ve yine de normal döner — çağıran
 * her durumda aynı cevabı verebilsin diye. Adresin sistemde olup olmadığı
 * dışarıdan ayırt edilememelidir.
 */
export async function requestPasswordReset(
  rawEmail: string,
  deps: ResetDeps,
): Promise<void> {
  const email = normalizeEmail(rawEmail)
  const account = await deps.accounts.findByEmail(email)
  if (!account) return

  const token = generateToken()
  await deps.resets.create(
    account.id,
    await hashToken(token),
    new Date(deps.now().getTime() + RESET_TTL_MS),
  )

  try {
    await deps.email.send({
      to: email,
      subject: 'Parolanı sıfırla',
      body:
        'Parolanı sıfırlamak için bu bağlantıya git:\n\n' +
        `${deps.resetUrl(token)}\n\n` +
        'Bağlantı 1 saat geçerli. Bu isteği sen yapmadıysan yok sayabilirsin; ' +
        'parolan değişmez.',
    })
  } catch {
    // Gönderim hatası çağırana sızmaz — hangi adreslerin var olduğunu
    // hata mesajından çıkarmak mümkün olmamalı.
  }
}

/**
 * Sıfırlamayı tamamlar.
 *
 * Parola politikası token harcanmadan ÖNCE kontrol edilir: kullanıcı zayıf
 * bir parola denediği için linkini kaybetmemeli.
 */
export async function completePasswordReset(
  token: string,
  newPassword: string,
  deps: ResetDeps,
): Promise<'ok' | 'invalid-token' | PolicyViolation> {
  if (!token) return 'invalid-token'

  const violation = await checkPassword(newPassword, deps.breaches)
  if (violation) return violation

  const accountId = await deps.resets.consume(await hashToken(token), deps.now())
  if (!accountId) return 'invalid-token'

  await deps.accounts.setPasswordHash(
    accountId,
    await deps.hasher.hash(newPassword),
  )

  // Sıfırlamanın yaygın sebebi hesabın ele geçirilmiş olması; mevcut tüm
  // oturumların düşmesi gerekir.
  await deps.sessions.revokeAllForAccount(accountId)

  return 'ok'
}
