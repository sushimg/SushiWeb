import { checkPassword, type PolicyViolation } from '../password-policy'
import { generateToken, hashToken } from '../tokens'
import { isPlausibleEmail, normalizeEmail } from '../email-address'
import type { AccountStore } from '../ports/account-store'
import type { BreachChecker } from '../password-policy'
import type { EmailSender } from '../ports/email-sender'
import type { PasswordHasher } from '../ports/password-hasher'
import type { VerificationStore } from '../ports/verification-store'

/** Doğrulama linki 24 saat geçerlidir. */
const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000

export interface RegisterInput {
  email: string
  password: string
  displayName: string | null
}

export interface RegisterDeps {
  accounts: AccountStore
  hasher: PasswordHasher
  breaches: BreachChecker
  email: EmailSender
  verifications: VerificationStore
  verificationUrl: (token: string) => string
  now: () => Date
}

export type RegisterResult =
  | { outcome: 'accepted' }
  | { outcome: 'rejected'; reason: 'invalid-email' | PolicyViolation }

/**
 * Yeni hesap açar.
 *
 * Adresin zaten kayıtlı olduğu durumda da 'accepted' döner ve hiçbir şey
 * yaratmaz — bunun yerine var olan adrese "birisi hesabınla kayıt olmaya
 * çalıştı" e-postası gider. Böylece cevap, adresin sistemde olup olmadığını
 * ele vermez; asıl sahibi ise durumdan haberdar olur.
 *
 * E-posta gönderimi başarısız olursa kayıt geri alınmaz: kullanıcının hesabı
 * durur ve doğrulamayı yeniden isteyebilir. Tersi, geçici bir posta arızasının
 * kullanıcıyı hesapsız bırakması demek olurdu.
 */
export async function register(
  input: RegisterInput,
  deps: RegisterDeps,
): Promise<RegisterResult> {
  const email = normalizeEmail(input.email)
  if (!isPlausibleEmail(email)) {
    return { outcome: 'rejected', reason: 'invalid-email' }
  }

  const violation = await checkPassword(input.password, deps.breaches)
  if (violation) return { outcome: 'rejected', reason: violation }

  const passwordHash = await deps.hasher.hash(input.password)
  const account = await deps.accounts.createWithPassword(
    { email, displayName: input.displayName },
    passwordHash,
  )

  if (!account) {
    await sendQuietly(deps, {
      to: email,
      subject: 'Sushi Systems hesabın zaten var',
      body:
        'Bu adresle bir hesap açılmaya çalışıldı, ama zaten bir hesabın var. ' +
        'Bunu sen yaptıysan giriş yapabilirsin; parolanı unuttuysan sıfırlama ' +
        'isteyebilirsin.',
    })
    return { outcome: 'accepted' }
  }

  const token = generateToken()
  await deps.verifications.create(
    account.id,
    await hashToken(token),
    new Date(deps.now().getTime() + VERIFICATION_TTL_MS),
  )

  await sendQuietly(deps, {
    to: email,
    subject: 'Hesabını doğrula',
    body:
      'Sushi Systems hesabını doğrulamak için bu bağlantıya git:\n\n' +
      `${deps.verificationUrl(token)}\n\n` +
      'Bağlantı 24 saat geçerli. Bu isteği sen yapmadıysan yok sayabilirsin.',
  })

  return { outcome: 'accepted' }
}

/** Gönderim hatası akışı durdurmaz — hesabın varlığı postadan önce gelir. */
async function sendQuietly(
  deps: RegisterDeps,
  email: Parameters<EmailSender['send']>[0],
): Promise<void> {
  try {
    await deps.email.send(email)
  } catch {
    // Yutuluyor: bkz. fonksiyon başlığındaki gerekçe.
  }
}
