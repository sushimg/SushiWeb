import { afterAll, describe, it } from 'vitest'
import { sql } from '../../db/client'
import { PostgresAccountStore } from '../postgres-account-store'
import { PostgresSessionStore } from '../postgres-session-store'
import { runSessionStoreContract } from './session-store-contract'

const hasDatabase = Boolean(process.env.DATABASE_URL)

// Bu dosyaya özel alt alan adı — bkz. postgres-account-store.test.ts'teki
// gerekçe. Diğer Postgres sözleşme dosyalarıyla çakışmaz.
const DOMAIN = 'sessionstore.example.com'

async function cleanup(): Promise<void> {
  await sql()`delete from accounts where email like ${'%@' + DOMAIN}`
}

if (!hasDatabase) {
  describe.skip('PostgresSessionStore (DATABASE_URL yok, atlandı)', () => {
    it('atlandı', () => {})
  })
} else {
  runSessionStoreContract('PostgresSessionStore', async () => {
    await cleanup()
    const accounts = new PostgresAccountStore()
    const account = await accounts.createWithPassword(
      { email: `oturum@${DOMAIN}`, displayName: null },
      'hash',
    )
    if (!account) throw new Error('test hesabı yaratılamadı')
    return { store: new PostgresSessionStore(), accountId: account.id }
  })

  afterAll(cleanup)
}
