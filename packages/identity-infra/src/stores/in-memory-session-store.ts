import type { SessionStore } from '@sushi/identity-core'

interface Row {
  accountId: string
  expiresAt: Date
  revoked: boolean
}

export class InMemorySessionStore implements SessionStore {
  private readonly rows = new Map<string, Row>()

  async create(
    accountId: string,
    tokenHash: string,
    expiresAt: Date,
    _userAgent: string | null,
  ): Promise<void> {
    this.rows.set(tokenHash, { accountId, expiresAt, revoked: false })
  }

  async findAccountId(tokenHash: string, now: Date): Promise<string | null> {
    const row = this.rows.get(tokenHash)
    if (!row || row.revoked || row.expiresAt <= now) return null
    return row.accountId
  }

  async revoke(tokenHash: string): Promise<void> {
    const row = this.rows.get(tokenHash)
    if (row) row.revoked = true
  }

  async revokeAllForAccount(accountId: string): Promise<void> {
    for (const row of this.rows.values()) {
      if (row.accountId === accountId) row.revoked = true
    }
  }

  /** İptal edilmiş oturum uzatılmaz — çıkış yapmış biri geri dönemez. */
  async touch(tokenHash: string, expiresAt: Date): Promise<void> {
    const row = this.rows.get(tokenHash)
    if (row && !row.revoked) row.expiresAt = expiresAt
  }
}
