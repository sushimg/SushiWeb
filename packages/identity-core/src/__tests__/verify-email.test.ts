import { describe, expect, it } from 'vitest'
import { hashToken } from '../tokens'
import { verifyEmail, type VerifyEmailDeps } from '../use-cases/verify-email'

function makeDeps() {
  const verified: string[] = []
  const stored = new Map<string, string>()

  const deps: VerifyEmailDeps = {
    accounts: {
      findByEmail: async () => null,
      findById: async () => null,
      createWithPassword: async () => null,
      findIdentity: async () => null,
      findPasswordIdentity: async () => null,
      setPasswordHash: async () => {},
      markEmailVerified: async id => void verified.push(id),
    },
    verifications: {
      create: async (accountId, tokenHash) => void stored.set(tokenHash, accountId),
      consume: async tokenHash => {
        const accountId = stored.get(tokenHash)
        if (!accountId) return null
        stored.delete(tokenHash)  // tek kullanımlık
        return accountId
      },
    },
    now: () => new Date('2026-01-01T00:00:00Z'),
  }

  return { deps, verified, stored }
}

describe('verifyEmail', () => {
  it('geçerli token hesabı doğrulanmış işaretler', async () => {
    const { deps, verified } = makeDeps()
    await deps.verifications.create('hesap-1', await hashToken('token-abc'), new Date())
    expect(await verifyEmail('token-abc', deps)).toBe(true)
    expect(verified).toEqual(['hesap-1'])
  })

  it('geçersiz token için false döner ve hiçbir şeyi işaretlemez', async () => {
    const { deps, verified } = makeDeps()
    expect(await verifyEmail('olmayan-token', deps)).toBe(false)
    expect(verified).toEqual([])
  })

  it('aynı token ikinci kez kullanılamaz', async () => {
    const { deps, verified } = makeDeps()
    await deps.verifications.create('hesap-1', await hashToken('token-abc'), new Date())
    expect(await verifyEmail('token-abc', deps)).toBe(true)
    expect(await verifyEmail('token-abc', deps)).toBe(false)
    expect(verified).toEqual(['hesap-1'])
  })

  it('boş token için false döner', async () => {
    const { deps } = makeDeps()
    expect(await verifyEmail('', deps)).toBe(false)
  })
})
