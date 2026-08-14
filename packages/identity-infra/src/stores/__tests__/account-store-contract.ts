import { describe, expect, it } from 'vitest'
import type { AccountStore } from '@sushi/identity-core'

/**
 * AccountStore'un davranış sözleşmesi. Her implementasyon bunu geçmelidir.
 *
 * makeStore her testte taze bir depo döndürmelidir — testler birbirinin
 * verisini görmemeli.
 */
export function runAccountStoreContract(
  name: string,
  makeStore: () => Promise<AccountStore>,
): void {
  describe(`${name} — AccountStore sözleşmesi`, () => {
    it('yarattığı hesabı e-postayla bulur', async () => {
      const store = await makeStore()
      const created = await store.createWithPassword(
        { email: 'a@example.com', displayName: 'A' },
        'hash1',
      )
      expect(created).not.toBeNull()
      const found = await store.findByEmail('a@example.com')
      expect(found?.id).toBe(created?.id)
      expect(found?.email).toBe('a@example.com')
      expect(found?.displayName).toBe('A')
    })

    it('yeni hesabı doğrulanmamış ve aktif olarak yaratır', async () => {
      const store = await makeStore()
      const created = await store.createWithPassword(
        { email: 'b@example.com', displayName: null },
        'hash1',
      )
      expect(created?.emailVerified).toBe(false)
      expect(created?.status).toBe('active')
    })

    it('olmayan e-posta için null döner', async () => {
      const store = await makeStore()
      expect(await store.findByEmail('yok@example.com')).toBeNull()
    })

    it('aynı e-postayla ikinci kez yaratmayı reddeder', async () => {
      const store = await makeStore()
      await store.createWithPassword(
        { email: 'c@example.com', displayName: null },
        'hash1',
      )
      const second = await store.createWithPassword(
        { email: 'c@example.com', displayName: null },
        'hash2',
      )
      expect(second).toBeNull()
    })

    it('id ile bulur', async () => {
      const store = await makeStore()
      const created = await store.createWithPassword(
        { email: 'd@example.com', displayName: null },
        'hash1',
      )
      expect((await store.findById(created!.id))?.email).toBe('d@example.com')
    })

    it('parola kimliğini hesaba bağlar', async () => {
      const store = await makeStore()
      const created = await store.createWithPassword(
        { email: 'e@example.com', displayName: null },
        'hash-abc',
      )
      const identity = await store.findPasswordIdentity(created!.id)
      expect(identity?.secretHash).toBe('hash-abc')
      expect(identity?.provider).toBe('password')
    })

    it("parola hash'ini günceller", async () => {
      const store = await makeStore()
      const created = await store.createWithPassword(
        { email: 'f@example.com', displayName: null },
        'eski-hash',
      )
      await store.setPasswordHash(created!.id, 'yeni-hash')
      expect((await store.findPasswordIdentity(created!.id))?.secretHash).toBe(
        'yeni-hash',
      )
    })

    it('e-postayı doğrulanmış işaretler', async () => {
      const store = await makeStore()
      const created = await store.createWithPassword(
        { email: 'g@example.com', displayName: null },
        'hash1',
      )
      await store.markEmailVerified(created!.id)
      expect((await store.findById(created!.id))?.emailVerified).toBe(true)
    })

    it('olmayan hesabın parola kimliği için null döner', async () => {
      const store = await makeStore()
      expect(
        await store.findPasswordIdentity('00000000-0000-0000-0000-000000000000'),
      ).toBeNull()
    })
  })
}
