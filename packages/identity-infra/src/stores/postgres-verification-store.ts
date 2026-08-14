import type { VerificationStore } from '@sushi/identity-core'
import { sql } from '../db/client'

/** Aynı şekli paylaşan iki tablo. Birlik kasıtlı olarak kapalı. */
export type VerificationTable = 'email_verifications' | 'password_resets'

/**
 * Tek kullanımlık token deposu.
 *
 * Harcama tek bir UPDATE ile yapılır: koşullar (harcanmamış ve süresi
 * dolmamış) WHERE içinde, işaretleme SET içinde, sonuç RETURNING ile döner.
 * Bu, "önce oku sonra yaz" desenindeki yarışı tamamen ortadan kaldırır —
 * eşzamanlı iki istekten yalnızca biri satırı günceller, diğeri boş döner.
 * Aynı işi iki sorguyla yapmak, aynı doğrulama linkinin iki kez
 * kullanılabildiği bir pencere açardı.
 */
export class PostgresVerificationStore implements VerificationStore {
  private readonly table: VerificationTable

  constructor(table: VerificationTable) {
    this.table = table
  }

  async create(
    accountId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    // Tablo adı parametrelenemez, bu yüzden sorgular iki sabit dal olarak
    // yazılıyor. Çağıranın verdiği bir dize asla sorgu metnine girmez.
    if (this.table === 'email_verifications') {
      await sql()`
        insert into email_verifications (account_id, token_hash, expires_at)
        values (${accountId}, ${tokenHash}, ${expiresAt.toISOString()})
      `
      return
    }
    await sql()`
      insert into password_resets (account_id, token_hash, expires_at)
      values (${accountId}, ${tokenHash}, ${expiresAt.toISOString()})
    `
  }

  async consume(tokenHash: string, now: Date): Promise<string | null> {
    const timestamp = now.toISOString()
    const rows =
      this.table === 'email_verifications'
        ? ((await sql()`
            update email_verifications set consumed_at = ${timestamp}
            where token_hash = ${tokenHash}
              and consumed_at is null
              and expires_at > ${timestamp}
            returning account_id
          `) as Array<{ account_id: string }>)
        : ((await sql()`
            update password_resets set consumed_at = ${timestamp}
            where token_hash = ${tokenHash}
              and consumed_at is null
              and expires_at > ${timestamp}
            returning account_id
          `) as Array<{ account_id: string }>)

    return rows[0]?.account_id ?? null
  }
}
