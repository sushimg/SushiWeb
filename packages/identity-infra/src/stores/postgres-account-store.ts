import type {
  Account,
  AccountStore,
  Identity,
  NewAccount,
} from '@sushi/identity-core'
import { sql } from '../db/client'

interface AccountRow {
  id: string
  email: string
  email_verified: boolean
  display_name: string | null
  status: Account['status']
}

interface IdentityRow {
  id: string
  account_id: string
  provider: Identity['provider']
  subject: string
  secret_hash: string | null
}

function toAccount(row: AccountRow): Account {
  return {
    id: row.id,
    email: row.email,
    emailVerified: row.email_verified,
    displayName: row.display_name,
    status: row.status,
  }
}

function toIdentity(row: IdentityRow): Identity {
  return {
    id: row.id,
    accountId: row.account_id,
    provider: row.provider,
    subject: row.subject,
    secretHash: row.secret_hash,
  }
}

export class PostgresAccountStore implements AccountStore {
  async findByEmail(email: string): Promise<Account | null> {
    const rows = (await sql()`
      select id, email, email_verified, display_name, status
      from accounts where email = ${email}
    `) as AccountRow[]
    return rows[0] ? toAccount(rows[0]) : null
  }

  async findById(id: string): Promise<Account | null> {
    const rows = (await sql()`
      select id, email, email_verified, display_name, status
      from accounts where id = ${id}
    `) as AccountRow[]
    return rows[0] ? toAccount(rows[0]) : null
  }

  /**
   * Hesap ve parola kimliği tek bir işlemde yaratılır. `on conflict do nothing`
   * yarış durumunu da kapsar: iki eşzamanlı kayıt isteğinden yalnızca biri
   * satır üretir, diğeri boş döner ve null'a çevrilir.
   */
  async createWithPassword(
    account: NewAccount,
    passwordHash: string,
  ): Promise<Account | null> {
    const rows = (await sql()`
      with new_account as (
        insert into accounts (email, display_name)
        values (${account.email}, ${account.displayName})
        on conflict (email) do nothing
        returning id, email, email_verified, display_name, status
      ), new_identity as (
        insert into identities (account_id, provider, subject, secret_hash)
        select id, 'password', id::text, ${passwordHash} from new_account
      )
      select * from new_account
    `) as AccountRow[]
    return rows[0] ? toAccount(rows[0]) : null
  }

  async findIdentity(
    provider: Identity['provider'],
    subject: string,
  ): Promise<Identity | null> {
    const rows = (await sql()`
      select id, account_id, provider, subject, secret_hash
      from identities where provider = ${provider} and subject = ${subject}
    `) as IdentityRow[]
    return rows[0] ? toIdentity(rows[0]) : null
  }

  async findPasswordIdentity(accountId: string): Promise<Identity | null> {
    const rows = (await sql()`
      select id, account_id, provider, subject, secret_hash
      from identities where provider = 'password' and account_id = ${accountId}
    `) as IdentityRow[]
    return rows[0] ? toIdentity(rows[0]) : null
  }

  async setPasswordHash(accountId: string, passwordHash: string): Promise<void> {
    await sql()`
      update identities set secret_hash = ${passwordHash}
      where provider = 'password' and account_id = ${accountId}
    `
  }

  async markEmailVerified(accountId: string): Promise<void> {
    await sql()`update accounts set email_verified = true where id = ${accountId}`
  }
}
