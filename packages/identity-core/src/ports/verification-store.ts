/**
 * Tek kullanımlık token deposu. E-posta doğrulama ve parola sıfırlama
 * aynı şekli paylaşır, bu yüzden aynı arayüzü iki farklı tablo için iki
 * kez implemente ederiz.
 *
 * Yalnızca token'ın hash'i saklanır; ham token hiçbir zaman geri okunamaz.
 */
export interface VerificationStore {
  create(accountId: string, tokenHash: string, expiresAt: Date): Promise<void>

  /**
   * Token'ı harcar ve sahibinin hesap id'sini döner. Geçersiz, süresi
   * dolmuş veya daha önce harcanmış token için null.
   *
   * Harcama atomik olmalıdır: aynı token'la eşzamanlı iki istekten yalnızca
   * biri hesap id'si almalı.
   */
  consume(tokenHash: string, now: Date): Promise<string | null>
}
