import type {
  Account,
  AccountStore,
  Identity,
  NewAccount,
} from '@sushi/identity-core'

/**
 * Testler ve yerel geliştirme için. Postgres adaptörüyle aynı sözleşmeyi
 * geçer — iki implementasyonun davranışı ortak bir test gövdesiyle
 * karşılaştırılır, yoksa "bellekte çalışıyor ama gerçekte çalışmıyor"
 * sınıfı hatalar gizli kalır.
 */
export class InMemoryAccountStore implements AccountStore {
  private readonly accounts = new Map<string, Account>()
  private readonly identities = new Map<string, Identity>()

  async findByEmail(email: string): Promise<Account | null> {
    for (const account of this.accounts.values()) {
      if (account.email === email) return { ...account }
    }
    return null
  }

  async findById(id: string): Promise<Account | null> {
    const account = this.accounts.get(id)
    return account ? { ...account } : null
  }

  async createWithPassword(
    account: NewAccount,
    passwordHash: string,
  ): Promise<Account | null> {
    if (await this.findByEmail(account.email)) return null

    const created: Account = {
      id: crypto.randomUUID(),
      email: account.email,
      emailVerified: false,
      displayName: account.displayName,
      status: 'active',
    }
    this.accounts.set(created.id, created)

    const identity: Identity = {
      id: crypto.randomUUID(),
      accountId: created.id,
      provider: 'password',
      subject: created.id,
      secretHash: passwordHash,
    }
    this.identities.set(identity.id, identity)

    return { ...created }
  }

  async findIdentity(
    provider: Identity['provider'],
    subject: string,
  ): Promise<Identity | null> {
    for (const identity of this.identities.values()) {
      if (identity.provider === provider && identity.subject === subject) {
        return { ...identity }
      }
    }
    return null
  }

  async findPasswordIdentity(accountId: string): Promise<Identity | null> {
    for (const identity of this.identities.values()) {
      if (identity.provider === 'password' && identity.accountId === accountId) {
        return { ...identity }
      }
    }
    return null
  }

  async setPasswordHash(accountId: string, passwordHash: string): Promise<void> {
    for (const identity of this.identities.values()) {
      if (identity.provider === 'password' && identity.accountId === accountId) {
        identity.secretHash = passwordHash
        return
      }
    }
  }

  async markEmailVerified(accountId: string): Promise<void> {
    const account = this.accounts.get(accountId)
    if (account) account.emailVerified = true
  }
}
