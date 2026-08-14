import { afterAll, describe, it } from 'vitest'
import { sql } from '../../db/client'
import { PostgresRateLimiter } from '../postgres-rate-limiter'
import { runRateLimiterContract } from './rate-limiter-contract'

const hasDatabase = Boolean(process.env.DATABASE_URL)

/** Sözleşme testleri sabit özneler kullanıyor; her koşu temiz başlamalı. */
async function cleanup(): Promise<void> {
  await sql()`delete from rate_limits where bucket in ('login', 'reset')`
}

if (!hasDatabase) {
  describe.skip('PostgresRateLimiter (DATABASE_URL yok, atlandı)', () => {
    it('atlandı', () => {})
  })
} else {
  runRateLimiterContract('PostgresRateLimiter', async () => {
    await cleanup()
    return new PostgresRateLimiter()
  })

  afterAll(cleanup)
}
