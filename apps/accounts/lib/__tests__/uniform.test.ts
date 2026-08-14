import { describe, expect, it } from 'vitest'
import { uniform } from '../uniform'

describe('uniform', () => {
  it('hızlı işi asgari süreye kadar bekletir', async () => {
    const started = Date.now()
    await uniform(Promise.resolve('bitti'), 120)
    expect(Date.now() - started).toBeGreaterThanOrEqual(110)
  })

  it('işin sonucunu aynen döner', async () => {
    expect(await uniform(Promise.resolve(42), 10)).toBe(42)
  })

  it('yavaş işi daha fazla geciktirmez', async () => {
    const slow = new Promise(resolve => setTimeout(() => resolve('yavaş'), 100))
    const started = Date.now()
    await uniform(slow, 20)
    // Asgari süre çoktan geçtiği için ek bekleme olmamalı.
    expect(Date.now() - started).toBeLessThan(180)
  })

  it('hata durumunda da asgari süreyi bekler', async () => {
    // Aksi hâlde başarısızlık, süresinden tanınır hâle gelirdi.
    const started = Date.now()
    await expect(uniform(Promise.reject(new Error('patladı')), 120)).rejects.toThrow(
      'patladı',
    )
    expect(Date.now() - started).toBeGreaterThanOrEqual(110)
  })
})
