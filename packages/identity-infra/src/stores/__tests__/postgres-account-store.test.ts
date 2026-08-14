import { afterAll, describe, it } from 'vitest'
import { sql } from '../../db/client'
import { PostgresAccountStore } from '../postgres-account-store'
import { runAccountStoreContract } from './account-store-contract'

const hasDatabase = Boolean(process.env.DATABASE_URL)

/**
 * Sözleşme testleri e-postaları sabit kullandığı için her koşuda temiz bir
 * başlangıç gerekir. Bu dosyaya özel bir alt alan adı (`accountstore.
 * example.com`) kullanıyoruz — hem RFC 2606'nın ayırdığı example.com
 * kökünde kalıyor, hem de diğer Postgres sözleşme dosyalarının (verification-
 * store, session-store) kendi alt alan adlarıyla çakışmıyor. Böylece
 * dosyalar paralel koşarken birbirinin verisini silmez.
 */
const DOMAIN = 'accountstore.example.com'

async function cleanup(): Promise<void> {
  await sql()`delete from accounts where email like ${'%@' + DOMAIN}`
}

if (!hasDatabase) {
  describe.skip('PostgresAccountStore (DATABASE_URL yok, atlandı)', () => {
    it('atlandı', () => {})
  })
} else {
  runAccountStoreContract(
    'PostgresAccountStore',
    async () => {
      await cleanup()
      return new PostgresAccountStore()
    },
    DOMAIN,
  )

  afterAll(cleanup)
}
