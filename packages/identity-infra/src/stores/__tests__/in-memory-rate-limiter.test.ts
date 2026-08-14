import { InMemoryRateLimiter } from '../in-memory-rate-limiter'
import { runRateLimiterContract } from './rate-limiter-contract'

runRateLimiterContract('InMemoryRateLimiter', async () => new InMemoryRateLimiter())
