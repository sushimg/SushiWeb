import type { SessionStore } from '@sushi/identity-core'
import { sql } from '../db/client'

/**
 * Oturumlar veritabanında tutulur çünkü iptal edilebilir olmaları gerekir.
 * Her sorgu üç koşulu birlikte kontrol eder: token eşleşiyor mu, iptal
 * edilmemiş mi, süresi dolmamış mı. Üçünü tek WHERE'de tutmak, birini
 * unutma ihtimalini ortadan kaldırır.
 */
export class PostgresSessionStore implements SessionStore {
  async create(
    accountId: string,
    tokenHash: string,
    expiresAt: Date,
    userAgent: string | null,
  ): Promise<void> {
    await sql()`
      insert into sessions (account_id, token_hash, expires_at, user_agent)
      values (${accountId}, ${tokenHash}, ${expiresAt.toISOString()}, ${userAgent})
    `
  }

  async findAccountId(tokenHash: string, now: Date): Promise<string | null> {
    const rows = (await sql()`
      select account_id from sessions
      where token_hash = ${tokenHash}
        and revoked_at is null
        and expires_at > ${now.toISOString()}
    `) as Array<{ account_id: string }>
    return rows[0]?.account_id ?? null
  }

  async revoke(tokenHash: string): Promise<void> {
    await sql()`
      update sessions set revoked_at = now()
      where token_hash = ${tokenHash} and revoked_at is null
    `
  }

  async revokeAllForAccount(accountId: string): Promise<void> {
    await sql()`
      update sessions set revoked_at = now()
      where account_id = ${accountId} and revoked_at is null
    `
  }

  async touch(tokenHash: string, expiresAt: Date): Promise<void> {
    // revoked_at koşulu şart: iptal edilmiş bir oturumun ömrünü uzatmak,
    // çıkış yapmış kullanıcıyı geri içeri almak olurdu.
    await sql()`
      update sessions set expires_at = ${expiresAt.toISOString()}
      where token_hash = ${tokenHash} and revoked_at is null
    `
  }
}
