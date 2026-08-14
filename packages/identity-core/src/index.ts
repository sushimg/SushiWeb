export { constantTimeEqual, generateToken, hashToken } from './tokens'
export {
  checkPassword,
  checkPasswordPolicy,
  type BreachChecker,
  type PolicyViolation,
} from './password-policy'
export type { PasswordHasher } from './ports/password-hasher'
export type { EmailSender, OutgoingEmail } from './ports/email-sender'
export type { AccountStore } from './ports/account-store'
export type {
  Account,
  AccountStatus,
  Identity,
  NewAccount,
} from './types'
export { isPlausibleEmail, normalizeEmail } from './email-address'
export type { VerificationStore } from './ports/verification-store'
export {
  register,
  type RegisterDeps,
  type RegisterInput,
  type RegisterResult,
} from './use-cases/register'
export { verifyEmail, type VerifyEmailDeps } from './use-cases/verify-email'
