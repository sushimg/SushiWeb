import { afterAll, describe, it } from 'vitest'
import { sql } from '../../db/client'
import { PostgresAccountStore } from '../postgres-account-store'
import { PostgresVerificationStore } from '../postgres-verification-store'
import { runVerificationStoreContract } from './verification-store-contract'

const hasDatabase = Boolean(process.env.DATABASE_URL)

async function cleanup(): Promise<void> {
  await sql()`delete from accounts where email like '%@example.com'`
}

if (!hasDatabase) {
  describe.skip('PostgresVerificationStore (DATABASE_URL yok, atlandı)', () => {
    it('atlandı', () => {})
  })
} else {
  // İki tablo da aynı sözleşmeyi geçmelidir — ikisi de aynı kuralları taşıyor.
  for (const table of ['email_verifications', 'password_resets'] as const) {
    runVerificationStoreContract(`PostgresVerificationStore(${table})`, async () => {
      await cleanup()
      const accounts = new PostgresAccountStore()
      const account = await accounts.createWithPassword(
        { email: `dogrulama@example.com`, displayName: null },
        'hash',
      )
      if (!account) throw new Error('test hesabı yaratılamadı')
      return { store: new PostgresVerificationStore(table), accountId: account.id }
    })
  }

  afterAll(cleanup)
}
