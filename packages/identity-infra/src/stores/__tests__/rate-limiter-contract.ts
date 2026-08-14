import { describe, expect, it } from 'vitest'
import type { RateLimiter } from '@sushi/identity-core'

const WINDOW = 60_000
const T0 = new Date('2026-01-01T12:00:00Z')
const T_SAME = new Date('2026-01-01T12:00:30Z')      // aynı pencere
const T_NEXT = new Date('2026-01-01T12:01:30Z')      // sonraki pencere

export function runRateLimiterContract(
  name: string,
  makeLimiter: () => Promise<RateLimiter>,
): void {
  describe(`${name} — RateLimiter sözleşmesi`, () => {
    it('sınırın altındaki isteklere izin verir', async () => {
      const limiter = await makeLimiter()
      expect(await limiter.hit('login', 'a', 3, WINDOW, T0)).toBe(true)
      expect(await limiter.hit('login', 'a', 3, WINDOW, T0)).toBe(true)
      expect(await limiter.hit('login', 'a', 3, WINDOW, T0)).toBe(true)
    })

    it('sınırı aşan isteği reddeder', async () => {
      const limiter = await makeLimiter()
      for (let i = 0; i < 3; i++) await limiter.hit('login', 'b', 3, WINDOW, T0)
      expect(await limiter.hit('login', 'b', 3, WINDOW, T0)).toBe(false)
    })

    it('aynı pencere içinde sayar', async () => {
      const limiter = await makeLimiter()
      for (let i = 0; i < 3; i++) await limiter.hit('login', 'c', 3, WINDOW, T0)
      expect(await limiter.hit('login', 'c', 3, WINDOW, T_SAME)).toBe(false)
    })

    it('yeni pencerede sayaç sıfırlanır', async () => {
      const limiter = await makeLimiter()
      for (let i = 0; i < 3; i++) await limiter.hit('login', 'd', 3, WINDOW, T0)
      expect(await limiter.hit('login', 'd', 3, WINDOW, T_NEXT)).toBe(true)
    })

    it('özneler birbirini etkilemez', async () => {
      const limiter = await makeLimiter()
      for (let i = 0; i < 3; i++) await limiter.hit('login', 'e', 3, WINDOW, T0)
      expect(await limiter.hit('login', 'f', 3, WINDOW, T0)).toBe(true)
    })

    it('kovalar birbirini etkilemez', async () => {
      // Giriş denemelerini tüketmek, parola sıfırlama hakkını yakmamalı.
      const limiter = await makeLimiter()
      for (let i = 0; i < 3; i++) await limiter.hit('login', 'g', 3, WINDOW, T0)
      expect(await limiter.hit('reset', 'g', 3, WINDOW, T0)).toBe(true)
    })
  })
}
