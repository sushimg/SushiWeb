import { hash, verify } from '@node-rs/argon2'
import type { PasswordHasher } from '@sushi/identity-core'

/**
 * Argon2id ile parola hash'leme.
 *
 * Parametreler OWASP'ın önerdiği alt sınırdan seçildi: 19 MiB bellek,
 * 2 geçiş, 1 paralellik. Bellek maliyeti kasıtlı olarak yüksek — Argon2id'nin
 * GPU'ya karşı koruması hesap gücünden değil, bellek talebinden gelir.
 *
 * Tuz ve parametreler çıktı dizesinin içinde taşınır, bu yüzden ayrıca
 * saklanmaları gerekmez ve parametreler ileride değiştiğinde eski hash'ler
 * doğrulanmaya devam eder.
 */
const OPTIONS = {
  // Algorithm.Argon2id == 2. `Algorithm` is an ambient `const enum`, which
  // cannot be imported under `verbatimModuleSyntax`, so the value is inlined.
  algorithm: 2,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const

export class Argon2Hasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return hash(password, OPTIONS)
  }

  async verify(password: string, digest: string): Promise<boolean> {
    // Bozuk veya boş hash bir kimlik doğrulama başarısızlığıdır, bir çökme
    // değil: aksi hâlde tek bir bozuk satır giriş uçunu tamamen düşürürdü.
    try {
      return await verify(digest, password, OPTIONS)
    } catch {
      return false
    }
  }
}
