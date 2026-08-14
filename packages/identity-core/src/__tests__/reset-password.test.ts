import { describe, expect, it } from 'vitest'
import { hashToken } from '../tokens'
import {
  completePasswordReset,
  requestPasswordReset,
  type ResetDeps,
} from '../use-cases/reset-password'
import type { Account } from '../types'
import type { OutgoingEmail } from '../ports/email-sender'

const ACCOUNT: Account = {
  id: 'hesap-1',
  email: 'a@example.com',
  emailVerified: true,
  displayName: 'A',
  status: 'active',
}

function makeDeps() {
  const sent: OutgoingEmail[] = []
  const tokens = new Map<string, string>()
  const passwords: string[] = []
  const revokedAll: string[] = []

  const deps: ResetDeps = {
    accounts: {
      findByEmail: async email => (email === ACCOUNT.email ? ACCOUNT : null),
      findById: async () => ACCOUNT,
      createWithPassword: async () => null,
      findIdentity: async () => null,
      findPasswordIdentity: async () => null,
      setPasswordHash: async (_id, hash) => void passwords.push(hash),
      markEmailVerified: async () => {},
    },
    hasher: { hash: async p => `hashed:${p}`, verify: async () => false },
    breaches: { isBreached: async () => false },
    email: { send: async e => void sent.push(e) },
    resets: {
      create: async (accountId, tokenHash) => void tokens.set(tokenHash, accountId),
      consume: async tokenHash => {
        const accountId = tokens.get(tokenHash)
        if (!accountId) return null
        tokens.delete(tokenHash)
        return accountId
      },
    },
    sessions: {
      create: async () => {},
      findAccountId: async () => null,
      revoke: async () => {},
      revokeAllForAccount: async id => void revokedAll.push(id),
      touch: async () => {},
    },
    resetUrl: token => `https://accounts.test/reset?token=${token}`,
    now: () => new Date('2026-01-01T00:00:00Z'),
  }

  return { deps, sent, tokens, passwords, revokedAll }
}

describe('requestPasswordReset', () => {
  it('kayıtlı adrese sıfırlama linki gönderir', async () => {
    const { deps, sent } = makeDeps()
    await requestPasswordReset('a@example.com', deps)
    expect(sent[0]?.body).toContain('https://accounts.test/reset?token=')
  })

  it('olmayan adres için hiçbir şey göndermez ama fırlatmaz', async () => {
    // Sessiz başarı: cevap, adresin kayıtlı olup olmadığını ele vermemeli.
    const { deps, sent } = makeDeps()
    await expect(requestPasswordReset('yok@example.com', deps)).resolves.toBeUndefined()
    expect(sent).toHaveLength(0)
  })

  it('e-postayı normalize eder', async () => {
    const { deps, sent } = makeDeps()
    await requestPasswordReset('  A@Example.COM ', deps)
    expect(sent).toHaveLength(1)
  })

  it('token\'ı hash\'lenmiş saklar', async () => {
    const { deps, sent, tokens } = makeDeps()
    await requestPasswordReset('a@example.com', deps)
    const rawToken = sent[0]!.body.split('token=')[1]!.split('\n')[0]!
    expect(tokens.has(rawToken)).toBe(false)
    expect(tokens.has(await hashToken(rawToken))).toBe(true)
  })
})

describe('completePasswordReset', () => {
  async function withToken() {
    const made = makeDeps()
    await requestPasswordReset('a@example.com', made.deps)
    const token = made.sent[0]!.body.split('token=')[1]!.split('\n')[0]!
    return { ...made, token }
  }

  it('geçerli token ile parolayı değiştirir', async () => {
    const { deps, token, passwords } = await withToken()
    expect(await completePasswordReset(token, 'yeni-parola-123', deps)).toBe('ok')
    expect(passwords).toEqual(['hashed:yeni-parola-123'])
  })

  it('sıfırlama sonrası tüm oturumları iptal eder', async () => {
    // Sıfırlamanın yaygın sebebi "başkası girdi" — sıfırlama onu atmalı.
    const { deps, token, revokedAll } = await withToken()
    await completePasswordReset(token, 'yeni-parola-123', deps)
    expect(revokedAll).toEqual(['hesap-1'])
  })

  it('geçersiz token için invalid-token döner', async () => {
    const { deps } = makeDeps()
    expect(await completePasswordReset('sahte', 'yeni-parola-123', deps)).toBe(
      'invalid-token',
    )
  })

  it('token tek kullanımlıktır', async () => {
    const { deps, token } = await withToken()
    expect(await completePasswordReset(token, 'yeni-parola-123', deps)).toBe('ok')
    expect(await completePasswordReset(token, 'baska-parola-123', deps)).toBe(
      'invalid-token',
    )
  })

  it('politikaya uymayan yeni parolayı reddeder ve token\'ı harcamaz', async () => {
    const { deps, token, passwords } = await withToken()
    expect(await completePasswordReset(token, 'kisa', deps)).toBe('too-short')
    expect(passwords).toEqual([])
    // Token hâlâ geçerli olmalı: kullanıcı daha iyi bir parolayla tekrar dener.
    expect(await completePasswordReset(token, 'yeni-parola-123', deps)).toBe('ok')
  })
})
