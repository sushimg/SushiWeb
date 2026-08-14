/**
 * Parola kuralları. Yerel olarak karar verilebilenler saf fonksiyonda,
 * ağa çıkmayı gerektiren sızıntı kontrolü ise port arkasında durur.
 *
 * Sıralama önemli: ucuz ve kesin olan kontroller önce koşar, böylece
 * geçersiz bir parola için ağ isteği hiç yapılmaz.
 */

export type PolicyViolation = 'too-short' | 'too-long' | 'breached'

/** UI'ın "en az N karakter" gibi metinlerde kullanması için dışa açılır. */
export const PASSWORD_MIN_BYTES = 12
const MIN_BYTES = PASSWORD_MIN_BYTES
const MAX_BYTES = 72

/**
 * Sızmış parola veri tabanına soran port. Gerçek implementasyonu
 * identity-infra'da; çekirdek yalnızca cevabı bilir, nereden geldiğini değil.
 */
export interface BreachChecker {
  isBreached(password: string): Promise<boolean>
}

/** Ağ gerektirmeyen kurallar. */
export function checkPasswordPolicy(password: string): PolicyViolation | null {
  const bytes = new TextEncoder().encode(password).length
  if (bytes < MIN_BYTES) return 'too-short'
  if (bytes > MAX_BYTES) return 'too-long'
  return null
}

/** Tüm kurallar. Yerel kural ihlal edilmişse ağa çıkılmaz. */
export async function checkPassword(
  password: string,
  breaches: BreachChecker,
): Promise<PolicyViolation | null> {
  const local = checkPasswordPolicy(password)
  if (local) return local
  return (await breaches.isBreached(password)) ? 'breached' : null
}
