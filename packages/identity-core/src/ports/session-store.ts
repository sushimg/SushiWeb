/**
 * Oturum deposu.
 *
 * Oturumlar veritabanında tutulur çünkü iptal edilebilir olmaları gerekir:
 * "tüm cihazlardan çık", parola sıfırlama sonrası zorunlu çıkış ve hesap
 * askıya alma, imzalı bir token'ın tek başına sunamayacağı şeyler.
 */
export interface SessionStore {
  create(
    accountId: string,
    tokenHash: string,
    expiresAt: Date,
    userAgent: string | null,
  ): Promise<void>

  /** Geçerli, süresi dolmamış ve iptal edilmemiş oturumun hesap id'si. */
  findAccountId(tokenHash: string, now: Date): Promise<string | null>

  revoke(tokenHash: string): Promise<void>
  revokeAllForAccount(accountId: string): Promise<void>

  /** Kullanımda oturumun ömrünü uzatır. */
  touch(tokenHash: string, expiresAt: Date): Promise<void>
}
