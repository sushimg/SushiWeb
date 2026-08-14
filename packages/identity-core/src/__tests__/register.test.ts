import { describe, expect, it } from 'vitest'
import { register, type RegisterDeps } from '../use-cases/register'
import type { AccountStore } from '../ports/account-store'
import type { Account } from '../types'
import type { OutgoingEmail } from '../ports/email-sender'

function makeDeps(overrides: Partial<RegisterDeps> = {}) {
  const accounts: Account[] = []
  const sent: OutgoingEmail[] = []
  const created: Array<{ accountId: string; tokenHash: string }> = []

  const store: AccountStore = {
    findByEmail: async email =>
      accounts.find(a => a.email === email) ?? null,
    findById: async id => accounts.find(a => a.id === id) ?? null,
    createWithPassword: async (account) => {
      if (accounts.some(a => a.email === account.email)) return null
      const made: Account = {
        id: `id-${accounts.length + 1}`,
        email: account.email,
        emailVerified: false,
        displayName: account.displayName,
        status: 'active',
      }
      accounts.push(made)
      return made
    },
    findIdentity: async () => null,
    findPasswordIdentity: async () => null,
    setPasswordHash: async () => {},
    markEmailVerified: async () => {},
  }

  const deps: RegisterDeps = {
    accounts: store,
    hasher: { hash: async p => `hashed:${p}`, verify: async () => false },
    breaches: { isBreached: async () => false },
    email: { send: async e => void sent.push(e) },
    verifications: {
      create: async (accountId, tokenHash) => void created.push({ accountId, tokenHash }),
      consume: async () => null,
    },
    verificationUrl: token => `https://accounts.test/verify?token=${token}`,
    now: () => new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }

  return { deps, accounts, sent, created }
}

describe('register', () => {
  it('geçerli girdiyle hesabı yaratır', async () => {
    const { deps, accounts } = makeDeps()
    const result = await register(
      { email: 'Yeni@Example.com', password: 'guclu-parola-123', displayName: 'Yeni' },
      deps,
    )
    expect(result.outcome).toBe('accepted')
    expect(accounts).toHaveLength(1)
    expect(accounts[0]?.email).toBe('yeni@example.com')
  })

  it('doğrulama e-postası gönderir ve link token içerir', async () => {
    const { deps, sent } = makeDeps()
    await register({ email: 'a@example.com', password: 'guclu-parola-123', displayName: null }, deps)
    expect(sent).toHaveLength(1)
    expect(sent[0]?.to).toBe('a@example.com')
    expect(sent[0]?.body).toContain('https://accounts.test/verify?token=')
  })

  it('token\'ı ham değil, hash\'lenmiş saklar', async () => {
    const { deps, sent, created } = makeDeps()
    await register({ email: 'a@example.com', password: 'guclu-parola-123', displayName: null }, deps)
    const rawToken = sent[0]!.body.split('token=')[1]!
    expect(created[0]?.tokenHash).not.toBe(rawToken)
    expect(created[0]?.tokenHash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('geçersiz e-postayı reddeder', async () => {
    const { deps, accounts } = makeDeps()
    const result = await register(
      { email: 'bu-bir-adres-degil', password: 'guclu-parola-123', displayName: null },
      deps,
    )
    expect(result).toEqual({ outcome: 'rejected', reason: 'invalid-email' })
    expect(accounts).toHaveLength(0)
  })

  it('politikaya uymayan parolayı reddeder', async () => {
    const { deps, accounts } = makeDeps()
    const result = await register(
      { email: 'a@example.com', password: 'kisa', displayName: null },
      deps,
    )
    expect(result).toEqual({ outcome: 'rejected', reason: 'too-short' })
    expect(accounts).toHaveLength(0)
  })

  it('sızmış parolayı reddeder', async () => {
    const { deps } = makeDeps({ breaches: { isBreached: async () => true } })
    const result = await register(
      { email: 'a@example.com', password: 'sizmis-parola-123', displayName: null },
      deps,
    )
    expect(result).toEqual({ outcome: 'rejected', reason: 'breached' })
  })

  it('e-posta zaten kayıtlıysa da accepted döner', async () => {
    // Hesap sayımı yasağı: cevap, adresin kayıtlı olup olmadığını ele
    // vermemeli. Saldırgan hangi adreslerin sistemde olduğunu öğrenememeli.
    const { deps, accounts } = makeDeps()
    const input = { email: 'a@example.com', password: 'guclu-parola-123', displayName: null }
    await register(input, deps)
    const second = await register(input, deps)
    expect(second.outcome).toBe('accepted')
    expect(accounts).toHaveLength(1)
  })

  it('e-posta zaten kayıtlıysa doğrulama değil, uyarı e-postası gönderir', async () => {
    const { deps, sent } = makeDeps()
    const input = { email: 'a@example.com', password: 'guclu-parola-123', displayName: null }
    await register(input, deps)
    await register(input, deps)
    expect(sent).toHaveLength(2)
    expect(sent[1]?.body).not.toContain('/verify?token=')
  })

  it('e-posta gönderimi patlarsa kayıt yine de başarılı sayılır', async () => {
    // Kullanıcı hesabını kaybetmemeli; doğrulamayı sonra yeniden isteyebilir.
    const { deps, accounts } = makeDeps({
      email: { send: async () => { throw new Error('smtp down') } },
    })
    const result = await register(
      { email: 'a@example.com', password: 'guclu-parola-123', displayName: null },
      deps,
    )
    expect(result.outcome).toBe('accepted')
    expect(accounts).toHaveLength(1)
  })
})
