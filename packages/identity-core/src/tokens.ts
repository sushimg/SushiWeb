/**
 * Tek kullanımlık token'lar: oturum, e-posta doğrulama, parola sıfırlama,
 * davet. Hepsi aynı şekli paylaşır — yüksek entropili rastgele bir dize
 * kullanıcıya gider, yalnızca SHA-256 özeti veritabanında durur.
 *
 * Parolalardan farklı olarak burada Argon2 gerekmez: token'lar zaten 256 bit
 * rastgele, yani sözlük saldırısına konu değiller. Yavaş hash, kazanç
 * sağlamadan her istek doğrulamasını yavaşlatırdı.
 */

const TOKEN_BYTES = 32

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Kullanıcıya gidecek ham token. Asla saklanmaz. */
export function generateToken(): string {
  const bytes = new Uint8Array(TOKEN_BYTES)
  crypto.getRandomValues(bytes)
  return toBase64Url(bytes)
}

/** Veritabanına yazılacak biçim. */
export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(token),
  )
  return [...new Uint8Array(digest)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Karşılaştırmanın ne kadarında eşleştiğini sızdırmadan karşılaştırır.
 * Düz === ilk farklı baytta durur ve durduğu ana kadar geçen süre, doğru
 * önekin uzunluğunun ölçümüdür.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
