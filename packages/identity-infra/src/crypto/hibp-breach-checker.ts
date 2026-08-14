import type { BreachChecker } from '@sushi/identity-core'

const API = 'https://api.pwnedpasswords.com/range/'

/**
 * Parolanın bilinen sızıntılarda geçip geçmediğini k-anonymity ile sorar.
 *
 * Parolanın SHA-1'inin yalnızca ilk 5 karakteri gönderilir; servis o önekle
 * başlayan tüm hash kuyruklarını döner ve eşleşme yerelde aranır. Böylece
 * servis hangi parolayı sorduğumuzu öğrenemez.
 *
 * SHA-1 burada bir güvenlik seçimi değil, servisin protokolü. Parola
 * saklamak için asla kullanılmaz — o iş Argon2id'nin.
 */
export class HibpBreachChecker implements BreachChecker {
  private readonly fetchImpl: typeof fetch

  constructor(fetchImpl: typeof fetch = fetch) {
    this.fetchImpl = fetchImpl
  }

  async isBreached(password: string): Promise<boolean> {
    let digest: string
    try {
      const bytes = await crypto.subtle.digest(
        'SHA-1',
        new TextEncoder().encode(password),
      )
      digest = [...new Uint8Array(bytes)]
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase()
    } catch {
      return false
    }

    const prefix = digest.slice(0, 5)
    const suffix = digest.slice(5)

    try {
      const response = await this.fetchImpl(`${API}${prefix}`)
      if (!response.ok) return false
      const body = await response.text()
      return body
        .split('\n')
        .some(line => line.split(':')[0]?.trim().toUpperCase() === suffix)
    } catch {
      // Fail open: sızıntı servisi erişilemezse kayıt akışı durmaz.
      return false
    }
  }
}
