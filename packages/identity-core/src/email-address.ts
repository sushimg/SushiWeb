/**
 * E-posta adresi işlemleri.
 *
 * Doğrulama kasıtlı olarak gevşek. Bir adresin gerçekten teslim edilebilir
 * olduğunu ancak ona posta göndererek anlarsın — ki akış zaten bunu yapıyor.
 * Katı bir regex'in tek başarısı, geçerli ama sıra dışı adresleri olan
 * kullanıcıları dışarıda bırakmaktır.
 */

/** Karşılaştırma ve saklama için tek biçim. */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase()
}

/** Bariz çöp girdileri eler; teslim edilebilirlik iddiası taşımaz. */
export function isPlausibleEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
