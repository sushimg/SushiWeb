import { afterAll, describe, it } from 'vitest'
import { sql } from '../../db/client'
import { PostgresRateLimiter } from '../postgres-rate-limiter'
import { runRateLimiterContract } from './rate-limiter-contract'

const hasDatabase = Boolean(process.env.DATABASE_URL)

// Sözleşmenin kullandığı kova adlarına bu dosyaya özel bir önek veriyoruz
// (`test-ratelimiter-` + gerçek kova adı). Uygulamanın gerçek kovaları
// (`register`, `login-ip`, `login-email`, `reset-ip`, `reset-email`,
// `reset-complete`) bu önekle asla çakışmaz, bu yüzden temizlik yalnızca bu
// dosyanın kendi test verisini siler.
const PREFIX = 'test-ratelimiter-'

/** Sözleşme testleri sabit özneler kullanıyor; her koşu temiz başlamalı. */
async function cleanup(): Promise<void> {
  await sql()`delete from rate_limits where bucket like ${PREFIX + '%'}`
}

if (!hasDatabase) {
  describe.skip('PostgresRateLimiter (DATABASE_URL yok, atlandı)', () => {
    it('atlandı', () => {})
  })
} else {
  runRateLimiterContract(
    'PostgresRateLimiter',
    async () => {
      await cleanup()
      return new PostgresRateLimiter()
    },
    PREFIX,
  )

  afterAll(cleanup)
}
