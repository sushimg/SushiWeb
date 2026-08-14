export type AccountStatus = 'active' | 'suspended' | 'deleted'

export interface Account {
  id: string
  email: string
  emailVerified: boolean
  displayName: string | null
  status: AccountStatus
}

export interface NewAccount {
  email: string
  displayName: string | null
}

/** Bir hesabın giriş yolu. */
export interface Identity {
  id: string
  accountId: string
  provider: 'password' | 'google'
  subject: string
  secretHash: string | null
}
