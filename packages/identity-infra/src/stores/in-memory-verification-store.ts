import type { VerificationStore } from '@sushi/identity-core'

interface Row {
  accountId: string
  expiresAt: Date
  consumed: boolean
}

/**
 * Testler için. Postgres implementasyonuyla aynı sözleşmeyi geçer.
 *
 * JavaScript tek iş parçacığında koştuğu için buradaki "atomiklik" bedava
 * gelir: consume'un kontrol ile işaretleme arasında await yoktur, dolayısıyla
 * araya başka bir çağrı giremez. Postgres'te aynı garanti tek bir UPDATE
 * ifadesinden gelir.
 */
export class InMemoryVerificationStore implements VerificationStore {
  private readonly rows = new Map<string, Row>()

  async create(
    accountId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    this.rows.set(tokenHash, { accountId, expiresAt, consumed: false })
  }

  async consume(tokenHash: string, now: Date): Promise<string | null> {
    const row = this.rows.get(tokenHash)
    if (!row) return null
    if (row.consumed) return null
    if (row.expiresAt <= now) return null
    row.consumed = true
    return row.accountId
  }
}
