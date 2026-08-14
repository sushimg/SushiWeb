import { describe, expect, it } from 'vitest'
import type { SessionStore } from '@sushi/identity-core'

const NOW = new Date('2026-01-01T12:00:00Z')
const LATER = new Date('2026-01-02T12:00:00Z')
const MUCH_LATER = new Date('2026-01-10T12:00:00Z')

export function runSessionStoreContract(
  name: string,
  makeStore: () => Promise<{ store: SessionStore; accountId: string }>,
): void {
  describe(`${name} — SessionStore sözleşmesi`, () => {
    it('yarattığı oturumu bulur', async () => {
      const { store, accountId } = await makeStore()
      await store.create(accountId, 'hash-1', LATER, 'Firefox')
      expect(await store.findAccountId('hash-1', NOW)).toBe(accountId)
    })

    it('bilinmeyen oturum için null döner', async () => {
      const { store } = await makeStore()
      expect(await store.findAccountId('olmayan', NOW)).toBeNull()
    })

    it('süresi dolmuş oturum bulunmaz', async () => {
      const { store, accountId } = await makeStore()
      await store.create(accountId, 'hash-1', new Date('2026-01-01T11:00:00Z'), null)
      expect(await store.findAccountId('hash-1', NOW)).toBeNull()
    })

    it('iptal edilmiş oturum bulunmaz', async () => {
      const { store, accountId } = await makeStore()
      await store.create(accountId, 'hash-1', LATER, null)
      await store.revoke('hash-1')
      expect(await store.findAccountId('hash-1', NOW)).toBeNull()
    })

    it('hesabın tüm oturumlarını iptal eder', async () => {
      const { store, accountId } = await makeStore()
      await store.create(accountId, 'hash-1', LATER, null)
      await store.create(accountId, 'hash-2', LATER, null)
      await store.revokeAllForAccount(accountId)
      expect(await store.findAccountId('hash-1', NOW)).toBeNull()
      expect(await store.findAccountId('hash-2', NOW)).toBeNull()
    })

    it('touch oturumun ömrünü uzatır', async () => {
      const { store, accountId } = await makeStore()
      await store.create(accountId, 'hash-1', LATER, null)
      await store.touch('hash-1', MUCH_LATER)
      // Eski son kullanma tarihinden sonraki bir anda hâlâ geçerli olmalı.
      expect(await store.findAccountId('hash-1', new Date('2026-01-05T12:00:00Z')))
        .toBe(accountId)
    })

    it('touch iptal edilmiş oturumu diriltmez', async () => {
      const { store, accountId } = await makeStore()
      await store.create(accountId, 'hash-1', LATER, null)
      await store.revoke('hash-1')
      await store.touch('hash-1', MUCH_LATER)
      expect(await store.findAccountId('hash-1', NOW)).toBeNull()
    })

    it('bilinmeyen oturumu iptal etmek hata vermez', async () => {
      const { store } = await makeStore()
      await expect(store.revoke('olmayan')).resolves.toBeUndefined()
    })
  })
}
