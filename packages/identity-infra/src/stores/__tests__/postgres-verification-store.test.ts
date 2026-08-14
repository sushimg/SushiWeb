import { afterAll, describe, it } from 'vitest'
import { sql } from '../../db/client'
import { PostgresAccountStore } from '../postgres-account-store'
import { PostgresVerificationStore } from '../postgres-verification-store'
import { runVerificationStoreContract } from './verification-store-contract'

const hasDatabase = Boolean(process.env.DATABASE_URL)

// Bu dosyaya özel alt alan adı — bkz. postgres-account-store.test.ts'teki
// gerekçe. Diğer Postgres sözleşme dosyalarıyla çakışmaz.
const DOMAIN = 'verificationstore.example.com'

async function cleanup(): Promise<void> {
  await sql()`delete from accounts where email like ${'%@' + DOMAIN}`
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
        { email: `dogrulama@${DOMAIN}`, displayName: null },
        'hash',
      )
      if (!account) throw new Error('test hesabı yaratılamadı')
      return { store: new PostgresVerificationStore(table), accountId: account.id }
    })
  }

  afterAll(cleanup)
}
