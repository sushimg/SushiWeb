import { describe, expect, it } from 'vitest'
import { hashToken } from '../tokens'
import { authenticate, login, logout, type LoginDeps } from '../use-cases/login'
import type { Account } from '../types'

const ACCOUNT: Account = {
  id: 'hesap-1',
  email: 'a@example.com',
  emailVerified: true,
  displayName: 'A',
  status: 'active',
}

function makeDeps(overrides: Partial<LoginDeps> = {}) {
  const sessions = new Map<string, { accountId: string; expiresAt: Date }>()
  let verifyCalls = 0

  const deps: LoginDeps = {
    accounts: {
      findByEmail: async email => (email === ACCOUNT.email ? ACCOUNT : null),
      findById: async id => (id === ACCOUNT.id ? ACCOUNT : null),
      createWithPassword: async () => null,
      findIdentity: async () => null,
      findPasswordIdentity: async accountId =>
        accountId === ACCOUNT.id
          ? {
              id: 'kimlik-1',
              accountId: ACCOUNT.id,
              provider: 'password',
              subject: ACCOUNT.id,
              secretHash: 'gercek-hash',
            }
          : null,
      setPasswordHash: async () => {},
      markEmailVerified: async () => {},
    },
    hasher: {
      hash: async p => `hashed:${p}`,
      verify: async (password, digest) => {
        verifyCalls++
        return digest === 'gercek-hash' && password === 'dogru-parola-123'
      },
    },
    sessions: {
      create: async (accountId, tokenHash, expiresAt) =>
        void sessions.set(tokenHash, { accountId, expiresAt }),
      findAccountId: async (tokenHash, now) => {
        const session = sessions.get(tokenHash)
        if (!session || session.expiresAt <= now) return null
        return session.accountId
      },
      revoke: async tokenHash => void sessions.delete(tokenHash),
      revokeAllForAccount: async accountId => {
        for (const [hash, session] of sessions) {
          if (session.accountId === accountId) sessions.delete(hash)
        }
      },
      touch: async (tokenHash, expiresAt) => {
        const session = sessions.get(tokenHash)
        if (session) session.expiresAt = expiresAt
      },
    },
    now: () => new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }

  return { deps, sessions, verifyCalls: () => verifyCalls }
}

describe('login', () => {
  it('doğru bilgilerle token döner', async () => {
    const { deps } = makeDeps()
    const result = await login(
      { email: 'a@example.com', password: 'dogru-parola-123', userAgent: null },
      deps,
    )
    expect(result?.token).toMatch(/^[A-Za-z0-9_-]{43,}$/)
  })

  it('oturumu ham token değil, hash ile saklar', async () => {
    const { deps, sessions } = makeDeps()
    const result = await login(
      { email: 'a@example.com', password: 'dogru-parola-123', userAgent: null },
      deps,
    )
    expect(sessions.has(result!.token)).toBe(false)
    expect(sessions.has(await hashToken(result!.token))).toBe(true)
  })

  it('yanlış parola için null döner', async () => {
    const { deps } = makeDeps()
    expect(
      await login(
        { email: 'a@example.com', password: 'yanlis-parola-123', userAgent: null },
        deps,
      ),
    ).toBeNull()
  })

  it('olmayan hesap için null döner', async () => {
    const { deps } = makeDeps()
    expect(
      await login({ email: 'yok@example.com', password: 'x', userAgent: null }, deps),
    ).toBeNull()
  })

  it('olmayan hesap için de hash doğrulaması koşturur', async () => {
    // Zamanlama saldırısına karşı: cevap süresi, hesabın var olup
    // olmadığını ele vermemeli.
    const { deps, verifyCalls } = makeDeps()
    await login({ email: 'yok@example.com', password: 'x', userAgent: null }, deps)
    expect(verifyCalls()).toBe(1)
  })

  it('e-postayı normalize ederek arar', async () => {
    const { deps } = makeDeps()
    const result = await login(
      { email: '  A@Example.COM ', password: 'dogru-parola-123', userAgent: null },
      deps,
    )
    expect(result).not.toBeNull()
  })

  it('askıya alınmış hesabı reddeder', async () => {
    const { deps } = makeDeps({
      accounts: {
        findByEmail: async () => ({ ...ACCOUNT, status: 'suspended' }),
        findById: async () => ({ ...ACCOUNT, status: 'suspended' }),
        createWithPassword: async () => null,
        findIdentity: async () => null,
        findPasswordIdentity: async () => ({
          id: 'kimlik-1',
          accountId: ACCOUNT.id,
          provider: 'password',
          subject: ACCOUNT.id,
          secretHash: 'gercek-hash',
        }),
        setPasswordHash: async () => {},
        markEmailVerified: async () => {},
      },
    })
    expect(
      await login(
        { email: 'a@example.com', password: 'dogru-parola-123', userAgent: null },
        deps,
      ),
    ).toBeNull()
  })

  it('doğrulanmamış hesap giriş yapabilir', async () => {
    // Doğrulama, yetkinin önkoşulu; kimliğin değil. Kullanıcı giriş yapıp
    // doğrulama e-postasını yeniden isteyebilmeli.
    const unverified = { ...ACCOUNT, emailVerified: false }
    const { deps } = makeDeps({
      accounts: {
        findByEmail: async () => unverified,
        findById: async () => unverified,
        createWithPassword: async () => null,
        findIdentity: async () => null,
        findPasswordIdentity: async () => ({
          id: 'kimlik-1',
          accountId: ACCOUNT.id,
          provider: 'password',
          subject: ACCOUNT.id,
          secretHash: 'gercek-hash',
        }),
        setPasswordHash: async () => {},
        markEmailVerified: async () => {},
      },
    })
    expect(
      await login(
        { email: 'a@example.com', password: 'dogru-parola-123', userAgent: null },
        deps,
      ),
    ).not.toBeNull()
  })
})

describe('authenticate', () => {
  it('geçerli token hesabı döner', async () => {
    const { deps } = makeDeps()
    const result = await login(
      { email: 'a@example.com', password: 'dogru-parola-123', userAgent: null },
      deps,
    )
    expect((await authenticate(result!.token, deps))?.id).toBe(ACCOUNT.id)
  })

  it('geçersiz token için null döner', async () => {
    const { deps } = makeDeps()
    expect(await authenticate('sahte-token', deps)).toBeNull()
  })

  it('boş token için null döner', async () => {
    const { deps } = makeDeps()
    expect(await authenticate('', deps)).toBeNull()
  })
})

describe('logout', () => {
  it('oturumu iptal eder', async () => {
    const { deps } = makeDeps()
    const result = await login(
      { email: 'a@example.com', password: 'dogru-parola-123', userAgent: null },
      deps,
    )
    await logout(result!.token, deps)
    expect(await authenticate(result!.token, deps)).toBeNull()
  })
})
