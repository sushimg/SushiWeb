import {
  Argon2Hasher,
  ConsoleEmailSender,
  HibpBreachChecker,
  PostgresAccountStore,
  PostgresRateLimiter,
  PostgresSessionStore,
  PostgresVerificationStore,
} from '@sushi/identity-infra'
import { appUrl } from './env'

/**
 * Bileşim kökü: somut implementasyonların seçildiği tek yer.
 *
 * Uygulamanın geri kalanı hiçbir adaptörü doğrudan import etmez; buradan
 * gelen nesneyi kullanır. Bir gün e-posta gerçekten gönderilmeye
 * başladığında değişecek tek satır burada olacak.
 */
const accounts = new PostgresAccountStore()
const sessions = new PostgresSessionStore()

export const deps = {
  accounts,
  sessions,
  hasher: new Argon2Hasher(),
  breaches: new HibpBreachChecker(),
  email: new ConsoleEmailSender(),
  verifications: new PostgresVerificationStore('email_verifications'),
  resets: new PostgresVerificationStore('password_resets'),
  limiter: new PostgresRateLimiter(),
  verificationUrl: (token: string) => `${appUrl()}/dogrula?token=${token}`,
  resetUrl: (token: string) => `${appUrl()}/sifirla?token=${token}`,
  now: () => new Date(),
}
