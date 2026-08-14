import type { Account, Identity, NewAccount } from '../types'

/**
 * Hesap ve giriş yolu kalıcılığı.
 *
 * Metotların hiçbiri "bulunamadı" durumunu hata saymaz — null döner. Çağıran
 * akışların çoğu hesabın yokluğunu normal bir dal olarak ele alır ve bunu
 * dışarıya sızdırmadan yapması gerekir (hesap sayımı yasağı).
 */
export interface AccountStore {
  /** E-posta normalize edilmiş gelir. Yoksa null. */
  findByEmail(email: string): Promise<Account | null>
  findById(id: string): Promise<Account | null>

  /**
   * Hesabı ve parola kimliğini birlikte yaratır — ikisi tek işlemde olmalı,
   * aksi hâlde giriş yolu olmayan yetim bir hesap kalabilir.
   * E-posta zaten kayıtlıysa null döner; fırlatmaz.
   */
  createWithPassword(
    account: NewAccount,
    passwordHash: string,
  ): Promise<Account | null>

  findIdentity(
    provider: Identity['provider'],
    subject: string,
  ): Promise<Identity | null>

  /** Hesaba bağlı parola kimliğini döner. Yoksa null (örn. yalnızca Google). */
  findPasswordIdentity(accountId: string): Promise<Identity | null>

  setPasswordHash(accountId: string, passwordHash: string): Promise<void>

  markEmailVerified(accountId: string): Promise<void>
}
