import { describe, expect, it } from 'vitest'
import type { VerificationStore } from '@sushi/identity-core'

const NOW = new Date('2026-01-01T12:00:00Z')
const LATER = new Date('2026-01-01T13:00:00Z')

/**
 * VerificationStore'un davranış sözleşmesi.
 *
 * makeStore her testte taze bir depo ve o depoya ait geçerli bir hesap id'si
 * döndürmelidir (Postgres'te yabancı anahtar gerçek bir hesap ister).
 */
export function runVerificationStoreContract(
  name: string,
  makeStore: () => Promise<{ store: VerificationStore; accountId: string }>,
): void {
  describe(`${name} — VerificationStore sözleşmesi`, () => {
    it('yarattığı token\'ı harcayınca hesap id\'sini döner', async () => {
      const { store, accountId } = await makeStore()
      await store.create(accountId, 'hash-1', LATER)
      expect(await store.consume('hash-1', NOW)).toBe(accountId)
    })

    it('bilinmeyen token için null döner', async () => {
      const { store } = await makeStore()
      expect(await store.consume('olmayan-hash', NOW)).toBeNull()
    })

    it('token tek kullanımlıktır', async () => {
      const { store, accountId } = await makeStore()
      await store.create(accountId, 'hash-1', LATER)
      expect(await store.consume('hash-1', NOW)).toBe(accountId)
      expect(await store.consume('hash-1', NOW)).toBeNull()
    })

    it('süresi dolmuş token harcanamaz', async () => {
      const { store, accountId } = await makeStore()
      // Son kullanma tarihi şimdiden önce.
      await store.create(accountId, 'hash-1', new Date('2026-01-01T11:00:00Z'))
      expect(await store.consume('hash-1', NOW)).toBeNull()
    })

    it('tam son kullanma anında harcanamaz', async () => {
      // Sınır bilinçli olarak katı: expires_at > now olmalı, >= değil.
      const { store, accountId } = await makeStore()
      await store.create(accountId, 'hash-1', NOW)
      expect(await store.consume('hash-1', NOW)).toBeNull()
    })

    it('aynı hesap için birden fazla token yaşayabilir', async () => {
      // Kullanıcı doğrulama e-postasını iki kez isteyebilir; ikisi de
      // geçerli olmalı, yoksa ilk linke tıklayan kullanıcı hata alır.
      const { store, accountId } = await makeStore()
      await store.create(accountId, 'hash-1', LATER)
      await store.create(accountId, 'hash-2', LATER)
      expect(await store.consume('hash-1', NOW)).toBe(accountId)
      expect(await store.consume('hash-2', NOW)).toBe(accountId)
    })

    it('eşzamanlı iki harcamadan yalnızca biri kazanır', async () => {
      // Atomiklik: aynı token'la gelen iki istek, iki kez doğrulama yapmamalı.
      const { store, accountId } = await makeStore()
      await store.create(accountId, 'hash-1', LATER)
      const results = await Promise.all([
        store.consume('hash-1', NOW),
        store.consume('hash-1', NOW),
      ])
      expect(results.filter(r => r === accountId)).toHaveLength(1)
      expect(results.filter(r => r === null)).toHaveLength(1)
    })
  })
}
