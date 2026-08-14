import { generateToken, hashToken } from '../tokens'
import { normalizeEmail } from '../email-address'
import type { Account } from '../types'
import type { AccountStore } from '../ports/account-store'
import type { PasswordHasher } from '../ports/password-hasher'
import type { SessionStore } from '../ports/session-store'

/** Oturum 30 gün geçerli, her kullanımda yenilenir. */
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

/**
 * Hesabı olmayan bir e-posta için de karşılaştırılacak bir hash gerekir.
 * Bu, geçerli formatta ama hiçbir parolayla eşleşmeyen bir Argon2id
 * çıktısıdır; tek amacı doğrulamanın gerçekten koşması ve cevabın hesabı
 * olan durumla aynı süreyi almasıdır.
 */
export const DUMMY_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$c2FsdHNhbHRzYWx0c2E$0000000000000000000000000000000000000000000'

/** Hesabı olmayan sorgularda kullanılan, hiçbir kayıtla eşleşmeyen id. */
const NIL_ACCOUNT_ID = '00000000-0000-0000-0000-000000000000'

export interface LoginInput {
  email: string
  password: string
  userAgent: string | null
}

export interface LoginDeps {
  accounts: AccountStore
  hasher: PasswordHasher
  sessions: SessionStore
  now: () => Date
}

/** `authenticate` yalnızca hesap ve oturum deposuna erişir; hasher gerekmez. */
export interface AuthenticateDeps {
  accounts: Pick<AccountStore, 'findById'>
  sessions: SessionStore
  now: () => Date
}

/** `logout` yalnızca oturumu iptal eder; hesap ya da hasher gerekmez. */
export interface LogoutDeps {
  sessions: Pick<SessionStore, 'revoke'>
}

/**
 * Parolayla giriş. Başarılıysa ham oturum token'ı döner — çağıran onu
 * cookie'ye koyar. Başarısızlığın sebebi asla dışarı sızmaz: yanlış parola,
 * olmayan hesap ve askıya alınmış hesap aynı null'u döner.
 */
export async function login(
  input: LoginInput,
  deps: LoginDeps,
): Promise<{ token: string } | null> {
  const email = normalizeEmail(input.email)
  const account = await deps.accounts.findByEmail(email)

  // Hesap yoksa bile sorgu koşturulur (yok sayılan nil id ile): aksi hâlde
  // sorgu tamamen atlanır ve gerçek depoda (Postgres/Neon) bu, Argon2
  // doğrulamasının eşitlediği birkaç milisaniyeden çok daha büyük bir süre
  // farkı yaratır — cevap süresi hesabın varlığını ele verir. Bu satırı
  // "gereksiz" sanıp silmeyin.
  const identity = await deps.accounts.findPasswordIdentity(
    account ? account.id : NIL_ACCOUNT_ID,
  )

  // Hesap yoksa da hash doğrulaması koşar: aksi hâlde cevap süresi hesabın
  // varlığını ele verirdi.
  const matches = await deps.hasher.verify(
    input.password,
    identity?.secretHash ?? DUMMY_HASH,
  )

  if (!account || !identity || !matches) return null
  if (account.status !== 'active') return null

  const token = generateToken()
  await deps.sessions.create(
    account.id,
    await hashToken(token),
    new Date(deps.now().getTime() + SESSION_TTL_MS),
    input.userAgent,
  )

  return { token }
}

/** Oturum token'ından hesabı çözer ve oturumun ömrünü uzatır. */
export async function authenticate(
  token: string,
  deps: AuthenticateDeps,
): Promise<Account | null> {
  if (!token) return null

  const tokenHash = await hashToken(token)
  const now = deps.now()
  const accountId = await deps.sessions.findAccountId(tokenHash, now)
  if (!accountId) return null

  const account = await deps.accounts.findById(accountId)
  if (!account || account.status !== 'active') return null

  await deps.sessions.touch(tokenHash, new Date(now.getTime() + SESSION_TTL_MS))
  return account
}

export async function logout(token: string, deps: LogoutDeps): Promise<void> {
  if (!token) return
  await deps.sessions.revoke(await hashToken(token))
}
