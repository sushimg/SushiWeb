import { afterAll, describe, it } from 'vitest'
import { sql } from '../../db/client'
import { PostgresAccountStore } from '../postgres-account-store'
import { runAccountStoreContract } from './account-store-contract'

const hasDatabase = Boolean(process.env.DATABASE_URL)

/**
 * Sözleşme testleri e-postaları sabit kullandığı için her koşuda temiz bir
 * başlangıç gerekir. Test hesaplarını @example.com alan adıyla tanıyıp
 * siliyoruz — gerçek kullanıcı adresleri bu alan adını kullanamaz (RFC 2606
 * onu tam da bu amaçla ayırmıştır).
 */
async function cleanup(): Promise<void> {
  await sql()`delete from accounts where email like '%@example.com'`
}

if (!hasDatabase) {
  describe.skip('PostgresAccountStore (DATABASE_URL yok, atlandı)', () => {
    it('atlandı', () => {})
  })
} else {
  runAccountStoreContract('PostgresAccountStore', async () => {
    await cleanup()
    return new PostgresAccountStore()
  })

  afterAll(cleanup)
}
