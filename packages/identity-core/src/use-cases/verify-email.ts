import { hashToken } from '../tokens'
import type { AccountStore } from '../ports/account-store'
import type { VerificationStore } from '../ports/verification-store'

export interface VerifyEmailDeps {
  accounts: AccountStore
  verifications: VerificationStore
  now: () => Date
}

/**
 * Doğrulama token'ını harcar ve hesabı doğrulanmış işaretler.
 *
 * Süre dolumu ve tek kullanımlık olma garantisi depoya aittir — orada
 * atomik yapılabilir, burada yapılamaz. Bu fonksiyonun tek işi token'ı
 * hash'leyip harcamak ve sonucu hesaba yansıtmak.
 */
export async function verifyEmail(
  token: string,
  deps: VerifyEmailDeps,
): Promise<boolean> {
  if (!token) return false

  const accountId = await deps.verifications.consume(
    await hashToken(token),
    deps.now(),
  )
  if (!accountId) return false

  await deps.accounts.markEmailVerified(accountId)
  return true
}
