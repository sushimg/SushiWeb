# Sushi Accounts — Plan 2: Kimlik Çekirdeği ve Adaptörler

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kayıt, e-posta doğrulama, giriş, oturum yönetimi ve parola sıfırlamayı, HTTP katmanı olmadan, tamamen test edilebilir iş kuralları olarak çalışır hâle getirmek.

**Architecture:** Her dış dünya ihtiyacı `identity-core` içinde bir port (TypeScript interface) olarak tanımlanır; gerçek implementasyonlar `identity-infra`'da yaşar. İş kuralları (use-case'ler) yalnızca portları görür, dolayısıyla testleri veritabanısız ve ağsız koşar. Bu planın sonunda "kayıt ol" bir fonksiyon çağrısıdır; Plan 3 ona web yüzü takar.

**Tech Stack:** TypeScript 6, Vitest 4, `@node-rs/argon2`, `@neondatabase/serverless`, Postgres (Neon).

**Spec:** `docs/superpowers/specs/2026-08-14-sushi-accounts-design.md`

**Önceki plan:** `docs/superpowers/plans/2026-08-14-accounts-01-temel.md` (tamamlandı, migration'lar gerçek veritabanına uygulandı)

## Global Constraints

- `packages/identity-core/package.json` `dependencies` alanı **boş kalmalıdır**; kaynak dosyaları `node:` modülü veya bare specifier import edemez. Mimari test bunu zorlar.
- Hiçbir token veritabanına ham hâlde yazılmaz. Yalnızca `hashToken()` çıktısı saklanır.
- Parola hash'i **Argon2id**'dir. Başka hiçbir algoritma parola için kullanılmaz.
- **Hesap sayımı (account enumeration) yasağı:** kayıt, giriş ve parola sıfırlama, hesabın var olup olmadığını ne dönen değerle ne hata mesajıyla ne de harcadığı süreyle ele vermez.
- Doğrulanmamış hesap hiçbir `grant` taşıyamaz ve hiçbir davet kabul edemez.
- E-posta adresleri karşılaştırmadan önce normalize edilir: kırpılır ve küçük harfe çevrilir.
- Test runner Vitest. Her paketin `test` ve `typecheck` script'i vardır ve ikisi de geçmelidir.
- Commit mesajları: Türkçe gövde, İngilizce conventional prefix.
- Bu planda HTTP, cookie, Next.js veya UI kodu **yoktur**. Hepsi Plan 3'e aittir.

---

### Task 1: Parola hash'leme portu ve Argon2id adaptörü

**Files:**
- Create: `packages/identity-core/src/ports/password-hasher.ts`
- Create: `packages/identity-infra/src/crypto/argon2-hasher.ts`
- Test: `packages/identity-infra/src/crypto/__tests__/argon2-hasher.test.ts`
- Modify: `packages/identity-core/src/index.ts`
- Modify: `packages/identity-infra/package.json` (bağımlılık ekle)

**Interfaces:**
- Consumes: yok
- Produces:
  - `interface PasswordHasher { hash(password: string): Promise<string>; verify(password: string, hash: string): Promise<boolean> }`
  - `class Argon2Hasher implements PasswordHasher`

- [ ] **Step 1: Portu tanımla**

`packages/identity-core/src/ports/password-hasher.ts`:

```ts
/**
 * Parola hash'leme portu.
 *
 * Çekirdek, hangi algoritmanın kullanıldığını bilmez — yalnızca "hash'le" ve
 * "doğrula" ister. Algoritma seçimi ve parametreleri adaptörün işidir, çünkü
 * ikisi de zamanla değişir: donanım hızlandıkça maliyet parametresi artar.
 */
export interface PasswordHasher {
  hash(password: string): Promise<string>
  /** Hash bozuk veya tanınmayan formatta ise fırlatmaz, false döner. */
  verify(password: string, hash: string): Promise<boolean>
}
```

- [ ] **Step 2: index.ts'ten dışa aktar**

`packages/identity-core/src/index.ts` dosyasının sonuna ekle:

```ts
export type { PasswordHasher } from './ports/password-hasher'
```

- [ ] **Step 3: Bağımlılığı kur**

```bash
npm install @node-rs/argon2 -w @sushi/identity-infra
```

`@node-rs/argon2` seçildi çünkü önceden derlenmiş ikili dosyalarla gelir — Windows'ta geliştirme, Linux'ta (Vercel) çalışma, ikisinde de derleyici gerektirmez. Kurulum `node-gyp` hatası verirse dur ve bildir; alternatif `hash-wasm` ama o karar planın dışında.

- [ ] **Step 4: Başarısız testi yaz**

`packages/identity-infra/src/crypto/__tests__/argon2-hasher.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { Argon2Hasher } from '../argon2-hasher'

const hasher = new Argon2Hasher()

describe('Argon2Hasher', () => {
  it('doğru parolayı doğrular', async () => {
    const hash = await hasher.hash('dogru-parola-123')
    expect(await hasher.verify('dogru-parola-123', hash)).toBe(true)
  })

  it('yanlış parolayı reddeder', async () => {
    const hash = await hasher.hash('dogru-parola-123')
    expect(await hasher.verify('yanlis-parola-123', hash)).toBe(false)
  })

  it('aynı parola için her seferinde farklı hash üretir', async () => {
    // Rastgele tuz olmasaydı, iki kullanıcının aynı parolayı seçtiği
    // veritabanından okunabilirdi.
    const a = await hasher.hash('ayni-parola-123')
    const b = await hasher.hash('ayni-parola-123')
    expect(a).not.toBe(b)
  })

  it('argon2id formatında hash üretir', async () => {
    expect(await hasher.hash('parola-123456')).toMatch(/^\$argon2id\$/)
  })

  it('bozuk hash için fırlatmaz, false döner', async () => {
    // Veritabanında bozulmuş bir satır, giriş uçunu 500 ile düşürmemeli.
    expect(await hasher.verify('parola-123456', 'bu-bir-hash-degil')).toBe(false)
  })

  it('boş hash için false döner', async () => {
    expect(await hasher.verify('parola-123456', '')).toBe(false)
  })
})
```

- [ ] **Step 5: Testi çalıştır, başarısız olduğunu gör**

```bash
npm test -w @sushi/identity-infra
```

Beklenen: FAIL — `Failed to resolve import "../argon2-hasher"`.

- [ ] **Step 6: Adaptörü yaz**

`packages/identity-infra/src/crypto/argon2-hasher.ts`:

```ts
import { hash, verify, Algorithm } from '@node-rs/argon2'
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
  algorithm: Algorithm.Argon2id,
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
```

- [ ] **Step 7: Testi çalıştır, geçtiğini gör**

```bash
npm test -w @sushi/identity-infra
npm run typecheck
```

Beklenen: tüm testler PASS, tip kontrolü temiz. Argon2 testleri kasıtlı olarak yavaştır (her hash ~50-100 ms) — bu bir sorun değil, işin doğası.

- [ ] **Step 8: Commit**

```bash
git add packages/identity-core packages/identity-infra package-lock.json
git commit -m "feat: parola hash'leme portu ve Argon2id adaptörü"
```

---

### Task 2: Sızmış parola kontrolü adaptörü

**Files:**
- Create: `packages/identity-infra/src/crypto/hibp-breach-checker.ts`
- Test: `packages/identity-infra/src/crypto/__tests__/hibp-breach-checker.test.ts`

**Interfaces:**
- Consumes: `BreachChecker` portu (Plan 1, `@sushi/identity-core`)
- Produces: `class HibpBreachChecker implements BreachChecker`, kurucusu `(fetchImpl?: typeof fetch)` alır

- [ ] **Step 1: Başarısız testi yaz**

`packages/identity-infra/src/crypto/__tests__/hibp-breach-checker.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { HibpBreachChecker } from '../hibp-breach-checker'

/** 'password' kelimesinin SHA-1'i: 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8 */
const PASSWORD_PREFIX = '5BAA6'
const PASSWORD_SUFFIX = '1E4C9B93F3F0682250B6CF8331B7EE68FD8'

function fakeFetch(body: string, status = 200) {
  const calls: string[] = []
  const impl = async (url: string | URL | Request) => {
    calls.push(String(url))
    return new Response(body, { status })
  }
  return { impl: impl as unknown as typeof fetch, calls }
}

describe('HibpBreachChecker', () => {
  it('sızmış parolayı bulur', async () => {
    const { impl } = fakeFetch(`${PASSWORD_SUFFIX}:12345\nAAAA:1`)
    expect(await new HibpBreachChecker(impl).isBreached('password')).toBe(true)
  })

  it('sızmamış parola için false döner', async () => {
    const { impl } = fakeFetch('AAAABBBB:1\nCCCCDDDD:2')
    expect(await new HibpBreachChecker(impl).isBreached('password')).toBe(false)
  })

  it('parolanın yalnızca ilk 5 hash karakterini gönderir', async () => {
    // k-anonymity: tam hash gönderilseydi, hangi parolayı sorduğumuz
    // servis tarafından bilinirdi.
    const { impl, calls } = fakeFetch('AAAA:1')
    await new HibpBreachChecker(impl).isBreached('password')
    expect(calls[0]).toContain(PASSWORD_PREFIX)
    expect(calls[0]).not.toContain(PASSWORD_SUFFIX)
  })

  it('büyük/küçük harf farkına takılmaz', async () => {
    const { impl } = fakeFetch(`${PASSWORD_SUFFIX.toLowerCase()}:5`)
    expect(await new HibpBreachChecker(impl).isBreached('password')).toBe(true)
  })

  it('servis hata verirse false döner', async () => {
    // Fail open, bilinçli: sızıntı servisi çöktüğünde kimse kayıt olamaz
    // hâle gelmemeli. Bu kontrol bir savunma katmanı, tek savunma değil.
    const { impl } = fakeFetch('', 503)
    expect(await new HibpBreachChecker(impl).isBreached('password')).toBe(false)
  })

  it('ağ tamamen düşerse false döner', async () => {
    const impl = (async () => {
      throw new Error('network down')
    }) as unknown as typeof fetch
    expect(await new HibpBreachChecker(impl).isBreached('password')).toBe(false)
  })
})
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

```bash
npm test -w @sushi/identity-infra
```

Beklenen: FAIL — `Failed to resolve import "../hibp-breach-checker"`.

- [ ] **Step 3: Adaptörü yaz**

`packages/identity-infra/src/crypto/hibp-breach-checker.ts`:

```ts
import type { BreachChecker } from '@sushi/identity-core'

const API = 'https://api.pwnedpasswords.com/range/'

/**
 * Parolanın bilinen sızıntılarda geçip geçmediğini k-anonymity ile sorar.
 *
 * Parolanın SHA-1'inin yalnızca ilk 5 karakteri gönderilir; servis o önekle
 * başlayan tüm hash kuyruklarını döner ve eşleşme yerelde aranır. Böylece
 * servis hangi parolayı sorduğumuzu öğrenemez.
 *
 * SHA-1 burada bir güvenlik seçimi değil, servisin protokolü. Parola
 * saklamak için asla kullanılmaz — o iş Argon2id'nin.
 */
export class HibpBreachChecker implements BreachChecker {
  constructor(private readonly fetchImpl: typeof fetch = fetch) {}

  async isBreached(password: string): Promise<boolean> {
    let digest: string
    try {
      const bytes = await crypto.subtle.digest(
        'SHA-1',
        new TextEncoder().encode(password),
      )
      digest = [...new Uint8Array(bytes)]
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase()
    } catch {
      return false
    }

    const prefix = digest.slice(0, 5)
    const suffix = digest.slice(5)

    try {
      const response = await this.fetchImpl(`${API}${prefix}`)
      if (!response.ok) return false
      const body = await response.text()
      return body
        .split('\n')
        .some(line => line.split(':')[0]?.trim().toUpperCase() === suffix)
    } catch {
      // Fail open: sızıntı servisi erişilemezse kayıt akışı durmaz.
      return false
    }
  }
}
```

- [ ] **Step 4: Testi çalıştır, geçtiğini gör**

```bash
npm test -w @sushi/identity-infra
npm run typecheck
```

Beklenen: 6 yeni test PASS. Testlerin hiçbiri gerçek ağa çıkmaz — hepsi sahte `fetch` kullanır.

- [ ] **Step 5: Commit**

```bash
git add packages/identity-infra
git commit -m "feat: k-anonymity ile sızmış parola kontrolü adaptörü"
```

---

### Task 3: E-posta gönderim portu ve konsol adaptörü

**Files:**
- Create: `packages/identity-core/src/ports/email-sender.ts`
- Create: `packages/identity-infra/src/email/console-email-sender.ts`
- Test: `packages/identity-infra/src/email/__tests__/console-email-sender.test.ts`
- Modify: `packages/identity-core/src/index.ts`

**Interfaces:**
- Consumes: yok
- Produces:
  - `type OutgoingEmail = { to: string; subject: string; body: string }`
  - `interface EmailSender { send(email: OutgoingEmail): Promise<void> }`
  - `class ConsoleEmailSender implements EmailSender` — kurucusu `(log?: (message: string) => void)`

Gerçek gönderim (Resend) bilinçli olarak sonraya bırakıldı. Bu port sayesinde eklenmesi tek dosyalık bir iş olacak; çağıran kodun hiçbiri değişmeyecek.

- [ ] **Step 1: Portu tanımla**

`packages/identity-core/src/ports/email-sender.ts`:

```ts
/**
 * E-posta gönderim portu.
 *
 * Çekirdek e-postanın nasıl gittiğini bilmez. Bugün konsola yazılıyor,
 * yarın bir servise gidecek; ikisi de bu arayüzü karşılar.
 *
 * `send` başarısız olursa fırlatır. Çağıran akışların çoğu bunu yutar:
 * doğrulama e-postası gönderilemedi diye kayıt geri alınmamalı, kullanıcı
 * daha sonra yeniden gönderim isteyebilir.
 */
export interface OutgoingEmail {
  to: string
  subject: string
  body: string
}

export interface EmailSender {
  send(email: OutgoingEmail): Promise<void>
}
```

- [ ] **Step 2: index.ts'ten dışa aktar**

`packages/identity-core/src/index.ts` sonuna ekle:

```ts
export type { EmailSender, OutgoingEmail } from './ports/email-sender'
```

- [ ] **Step 3: Başarısız testi yaz**

`packages/identity-infra/src/email/__tests__/console-email-sender.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { ConsoleEmailSender } from '../console-email-sender'

describe('ConsoleEmailSender', () => {
  it('alıcıyı, konuyu ve gövdeyi yazar', async () => {
    const lines: string[] = []
    await new ConsoleEmailSender(m => lines.push(m)).send({
      to: 'mustafa@example.com',
      subject: 'Hesabını doğrula',
      body: 'https://accounts.example.com/verify?token=abc',
    })
    const output = lines.join('\n')
    expect(output).toContain('mustafa@example.com')
    expect(output).toContain('Hesabını doğrula')
    expect(output).toContain('https://accounts.example.com/verify?token=abc')
  })

  it('her e-posta için tek bir çağrı yapar', async () => {
    const lines: string[] = []
    const sender = new ConsoleEmailSender(m => lines.push(m))
    await sender.send({ to: 'a@b.c', subject: 's', body: 'b' })
    await sender.send({ to: 'd@e.f', subject: 's', body: 'b' })
    expect(lines).toHaveLength(2)
  })
})
```

- [ ] **Step 4: Testi çalıştır, başarısız olduğunu gör**

```bash
npm test -w @sushi/identity-infra
```

Beklenen: FAIL — `Failed to resolve import "../console-email-sender"`.

- [ ] **Step 5: Adaptörü yaz**

`packages/identity-infra/src/email/console-email-sender.ts`:

```ts
import type { EmailSender, OutgoingEmail } from '@sushi/identity-core'

/**
 * E-postayı göndermez, yazar. Geliştirme için ve gerçek gönderim
 * eklenene kadar.
 *
 * Log fonksiyonu dışarıdan alınır: testler onu yakalayabilsin, ve üretimde
 * yanlışlıkla kullanılırsa çıktı uygulamanın log hattına düşsün.
 */
export class ConsoleEmailSender implements EmailSender {
  constructor(private readonly log: (message: string) => void = console.log) {}

  async send(email: OutgoingEmail): Promise<void> {
    this.log(
      [
        '--- E-POSTA (gönderilmedi, yalnızca yazıldı) ---',
        `Alıcı : ${email.to}`,
        `Konu  : ${email.subject}`,
        '',
        email.body,
        '--- son ---',
      ].join('\n'),
    )
  }
}
```

- [ ] **Step 6: Testi çalıştır, geçtiğini gör**

```bash
npm test -w @sushi/identity-infra
npm run typecheck
```

- [ ] **Step 7: Commit**

```bash
git add packages/identity-core packages/identity-infra
git commit -m "feat: e-posta gönderim portu ve konsol adaptörü"
```

---

### Task 4: Hesap deposu portu ve bellek implementasyonu

**Files:**
- Create: `packages/identity-core/src/ports/account-store.ts`
- Create: `packages/identity-core/src/types.ts`
- Create: `packages/identity-infra/src/stores/in-memory-account-store.ts`
- Test: `packages/identity-infra/src/stores/__tests__/account-store-contract.ts` (paylaşılan sözleşme testi, `.test.ts` değil)
- Test: `packages/identity-infra/src/stores/__tests__/in-memory-account-store.test.ts`
- Modify: `packages/identity-core/src/index.ts`

**Interfaces:**
- Consumes: yok
- Produces:
  - `type Account = { id: string; email: string; emailVerified: boolean; displayName: string | null; status: 'active' | 'suspended' | 'deleted' }`
  - `type NewAccount = { email: string; displayName: string | null }`
  - `interface AccountStore` — aşağıdaki metotlarla
  - `class InMemoryAccountStore implements AccountStore`
  - `runAccountStoreContract(name: string, makeStore: () => Promise<AccountStore>)` — Task 5'in Postgres adaptörünün de koşacağı ortak test gövdesi

- [ ] **Step 1: Tipleri ve portu tanımla**

`packages/identity-core/src/types.ts`:

```ts
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
```

`packages/identity-core/src/ports/account-store.ts`:

```ts
import type { Account, Identity, NewAccount } from '../types'

/**
 * Hesap ve giriş yolu kalıcılığı.
 *
 * Metotların hiçbiri "bulunamadı" durumunu hata saymaz — null döner. Çağıran
 * akışların çoğu hesabın yokluğunu normal bir dal olarak ele alır ve bunu
 * dışarıya sızdırmadan yapması gerekir (hesap sayımı yasağı).
 */
export interface AccountStore {
  /** E-posta normalize edilmiş gelir. Yoksa null. */
  findByEmail(email: string): Promise<Account | null>
  findById(id: string): Promise<Account | null>

  /**
   * Hesabı ve parola kimliğini birlikte yaratır — ikisi tek işlemde olmalı,
   * aksi hâlde giriş yolu olmayan yetim bir hesap kalabilir.
   * E-posta zaten kayıtlıysa null döner; fırlatmaz.
   */
  createWithPassword(
    account: NewAccount,
    passwordHash: string,
  ): Promise<Account | null>

  findIdentity(
    provider: Identity['provider'],
    subject: string,
  ): Promise<Identity | null>

  /** Hesaba bağlı parola kimliğini döner. Yoksa null (örn. yalnızca Google). */
  findPasswordIdentity(accountId: string): Promise<Identity | null>

  setPasswordHash(accountId: string, passwordHash: string): Promise<void>

  markEmailVerified(accountId: string): Promise<void>
}
```

- [ ] **Step 2: index.ts'ten dışa aktar**

`packages/identity-core/src/index.ts` sonuna ekle:

```ts
export type { AccountStore } from './ports/account-store'
export type {
  Account,
  AccountStatus,
  Identity,
  NewAccount,
} from './types'
```

- [ ] **Step 3: Paylaşılan sözleşme testini yaz**

Bu dosya `.test.ts` DEĞİL — Vitest onu kendi başına toplamamalı; iki ayrı test dosyası tarafından çağrılır. Task 5'te Postgres adaptörü de aynı gövdeyi koşacak, böylece iki implementasyonun aynı şekilde davrandığı kanıtlanır.

`packages/identity-infra/src/stores/__tests__/account-store-contract.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { AccountStore } from '@sushi/identity-core'

/**
 * AccountStore'un davranış sözleşmesi. Her implementasyon bunu geçmelidir.
 *
 * makeStore her testte taze bir depo döndürmelidir — testler birbirinin
 * verisini görmemeli.
 */
export function runAccountStoreContract(
  name: string,
  makeStore: () => Promise<AccountStore>,
): void {
  describe(`${name} — AccountStore sözleşmesi`, () => {
    it('yarattığı hesabı e-postayla bulur', async () => {
      const store = await makeStore()
      const created = await store.createWithPassword(
        { email: 'a@example.com', displayName: 'A' },
        'hash1',
      )
      expect(created).not.toBeNull()
      const found = await store.findByEmail('a@example.com')
      expect(found?.id).toBe(created?.id)
      expect(found?.email).toBe('a@example.com')
      expect(found?.displayName).toBe('A')
    })

    it('yeni hesabı doğrulanmamış ve aktif olarak yaratır', async () => {
      const store = await makeStore()
      const created = await store.createWithPassword(
        { email: 'b@example.com', displayName: null },
        'hash1',
      )
      expect(created?.emailVerified).toBe(false)
      expect(created?.status).toBe('active')
    })

    it('olmayan e-posta için null döner', async () => {
      const store = await makeStore()
      expect(await store.findByEmail('yok@example.com')).toBeNull()
    })

    it('aynı e-postayla ikinci kez yaratmayı reddeder', async () => {
      const store = await makeStore()
      await store.createWithPassword(
        { email: 'c@example.com', displayName: null },
        'hash1',
      )
      const second = await store.createWithPassword(
        { email: 'c@example.com', displayName: null },
        'hash2',
      )
      expect(second).toBeNull()
    })

    it('id ile bulur', async () => {
      const store = await makeStore()
      const created = await store.createWithPassword(
        { email: 'd@example.com', displayName: null },
        'hash1',
      )
      expect((await store.findById(created!.id))?.email).toBe('d@example.com')
    })

    it('parola kimliğini hesaba bağlar', async () => {
      const store = await makeStore()
      const created = await store.createWithPassword(
        { email: 'e@example.com', displayName: null },
        'hash-abc',
      )
      const identity = await store.findPasswordIdentity(created!.id)
      expect(identity?.secretHash).toBe('hash-abc')
      expect(identity?.provider).toBe('password')
    })

    it('parola hash\'ini günceller', async () => {
      const store = await makeStore()
      const created = await store.createWithPassword(
        { email: 'f@example.com', displayName: null },
        'eski-hash',
      )
      await store.setPasswordHash(created!.id, 'yeni-hash')
      expect((await store.findPasswordIdentity(created!.id))?.secretHash).toBe(
        'yeni-hash',
      )
    })

    it('e-postayı doğrulanmış işaretler', async () => {
      const store = await makeStore()
      const created = await store.createWithPassword(
        { email: 'g@example.com', displayName: null },
        'hash1',
      )
      await store.markEmailVerified(created!.id)
      expect((await store.findById(created!.id))?.emailVerified).toBe(true)
    })

    it('olmayan hesabın parola kimliği için null döner', async () => {
      const store = await makeStore()
      expect(
        await store.findPasswordIdentity('00000000-0000-0000-0000-000000000000'),
      ).toBeNull()
    })
  })
}
```

- [ ] **Step 4: Testi çalıştır, başarısız olduğunu gör**

`packages/identity-infra/src/stores/__tests__/in-memory-account-store.test.ts`:

```ts
import { InMemoryAccountStore } from '../in-memory-account-store'
import { runAccountStoreContract } from './account-store-contract'

runAccountStoreContract('InMemoryAccountStore', async () => new InMemoryAccountStore())
```

```bash
npm test -w @sushi/identity-infra
```

Beklenen: FAIL — `Failed to resolve import "../in-memory-account-store"`.

- [ ] **Step 5: Bellek implementasyonunu yaz**

`packages/identity-infra/src/stores/in-memory-account-store.ts`:

```ts
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
```

Dikkat: her okuma metodu kopya döndürür (`{ ...account }`). Referans döndürseydi, çağıran kod depodaki veriyi farkında olmadan değiştirebilir ve bellek implementasyonu Postgres'ten farklı davranırdı — sözleşme testinin yakalayamayacağı türden bir sapma.

- [ ] **Step 6: Testi çalıştır, geçtiğini gör**

```bash
npm test -w @sushi/identity-infra
npm run typecheck
```

Beklenen: 9 sözleşme testi PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/identity-core packages/identity-infra
git commit -m "feat: hesap deposu portu, sözleşme testi ve bellek implementasyonu"
```

---

### Task 5: Postgres hesap deposu

**Files:**
- Create: `packages/identity-infra/src/stores/postgres-account-store.ts`
- Test: `packages/identity-infra/src/stores/__tests__/postgres-account-store.test.ts`

**Interfaces:**
- Consumes: `AccountStore` portu ve `runAccountStoreContract` (Task 4), `sql()` (Plan 1)
- Produces: `class PostgresAccountStore implements AccountStore`

Bu testler gerçek veritabanına bağlanır. `DATABASE_URL` yoksa test dosyası kendini atlamalıdır — CI'da veya veritabanı olmayan bir makinede paket testleri kırmasın diye.

- [ ] **Step 1: Başarısız testi yaz**

`packages/identity-infra/src/stores/__tests__/postgres-account-store.test.ts`:

```ts
import { afterAll, describe, it } from 'vitest'
import { sql } from '../../db/client'
import { PostgresAccountStore } from '../postgres-account-store'
import { runAccountStoreContract } from './account-store-contract'

const hasDatabase = Boolean(process.env.DATABASE_URL)

/**
 * Sözleşme testleri e-postaları sabit kullandığı için her koşuda temiz bir
 * başlangıç gerekir. Test hesaplarını @example.com alan adıyla tanıyıp
 * siliyoruz — gerçek kullanıcı adresleri bu alan adını kullanamaz (RFC 2606
 * onu tam da bu amaçla ayırmıştır).
 */
async function cleanup(): Promise<void> {
  await sql()`delete from accounts where email like '%@example.com'`
}

if (!hasDatabase) {
  describe.skip('PostgresAccountStore (DATABASE_URL yok, atlandı)', () => {
    it('atlandı', () => {})
  })
} else {
  runAccountStoreContract('PostgresAccountStore', async () => {
    await cleanup()
    return new PostgresAccountStore()
  })

  afterAll(cleanup)
}
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

```bash
npm test -w @sushi/identity-infra
```

Beklenen: FAIL — `Failed to resolve import "../postgres-account-store"`.

- [ ] **Step 3: Adaptörü yaz**

`packages/identity-infra/src/stores/postgres-account-store.ts`:

```ts
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
```

- [ ] **Step 4: Testi çalıştır, geçtiğini gör**

`.env.local` dosyasının repo kökünde olduğundan emin ol, sonra:

```bash
npm test -w @sushi/identity-infra
```

Vitest `.env.local`'ı kendi başına okumaz. `packages/identity-infra/vitest.config.ts` dosyasına şunu ekle:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Kök .env.local'daki DATABASE_URL'i testlere taşır; yoksa Postgres
    // testleri kendini atlar.
    env: { ...process.env },
    setupFiles: ['./vitest.setup.ts'],
  },
})
```

ve `packages/identity-infra/vitest.setup.ts`:

```ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Kök .env.local'ı okur. Node'un --env-file bayrağı Vitest süreci için
 * geçerli olmadığından, ortamı burada elle kuruyoruz. Dosya yoksa sessizce
 * geçilir — o durumda veritabanı testleri kendini atlar.
 */
try {
  const contents = readFileSync(
    join(import.meta.dirname, '../../.env.local'),
    'utf8',
  )
  for (const line of contents.split('\n')) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
    if (match?.[1] && !process.env[match[1]]) {
      process.env[match[1]] = match[2]?.replace(/^["']|["']$/g, '')
    }
  }
} catch {
  // .env.local yok — veritabanı testleri atlanacak.
}
```

Beklenen: 9 sözleşme testi hem `InMemoryAccountStore` hem `PostgresAccountStore` için PASS (toplam 18).

- [ ] **Step 5: Atlama davranışını doğrula**

`.env.local` dosyasını geçici olarak yeniden adlandır, testleri çalıştır, Postgres testlerinin *atlandığını* (hata vermediğini) gör, sonra adı geri al.

```bash
mv .env.local .env.local.bak
npm test -w @sushi/identity-infra
mv .env.local.bak .env.local
```

Beklenen: bellek testleri geçer, Postgres testleri `skipped` görünür, çıkış kodu 0.

- [ ] **Step 6: Commit**

```bash
git add packages/identity-infra
git commit -m "feat: Postgres hesap deposu ve ortak sözleşme testi"
```

---

### Task 6: Kayıt ve e-posta doğrulama iş kuralları

**Files:**
- Create: `packages/identity-core/src/ports/verification-store.ts`
- Create: `packages/identity-core/src/use-cases/register.ts`
- Create: `packages/identity-core/src/use-cases/verify-email.ts`
- Test: `packages/identity-core/src/__tests__/register.test.ts`
- Test: `packages/identity-core/src/__tests__/verify-email.test.ts`
- Create: `packages/identity-core/src/email-address.ts`
- Test: `packages/identity-core/src/__tests__/email-address.test.ts`
- Modify: `packages/identity-core/src/index.ts`

**Interfaces:**
- Consumes: `AccountStore`, `PasswordHasher`, `BreachChecker`, `EmailSender`, `generateToken`, `hashToken`, `checkPassword`
- Produces:
  - `normalizeEmail(raw: string): string`
  - `isPlausibleEmail(email: string): boolean`
  - `interface VerificationStore { create(accountId: string, tokenHash: string, expiresAt: Date): Promise<void>; consume(tokenHash: string, now: Date): Promise<string | null> }`
  - `type RegisterResult = { outcome: 'accepted' } | { outcome: 'rejected'; reason: 'invalid-email' | PolicyViolation }`
  - `register(input, deps): Promise<RegisterResult>`
  - `verifyEmail(token, deps, now): Promise<boolean>`

- [ ] **Step 1: E-posta normalleştirme testini yaz**

`packages/identity-core/src/__tests__/email-address.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { isPlausibleEmail, normalizeEmail } from '../email-address'

describe('normalizeEmail', () => {
  it('küçük harfe çevirir', () => {
    expect(normalizeEmail('Mustafa@Example.COM')).toBe('mustafa@example.com')
  })

  it('baştaki ve sondaki boşlukları kırpar', () => {
    expect(normalizeEmail('  a@b.com  ')).toBe('a@b.com')
  })

  it('içerideki noktaları ve artıları korur', () => {
    // Gmail bunları yok sayar ama bu bir sunucu kararıdır, bizim değil.
    // Adresi değiştirmek, kullanıcının kaydolduğu adrese posta gitmemesi
    // demek olabilir.
    expect(normalizeEmail('a.b+etiket@example.com')).toBe('a.b+etiket@example.com')
  })
})

describe('isPlausibleEmail', () => {
  it('sıradan adresi kabul eder', () => {
    expect(isPlausibleEmail('mustafa@example.com')).toBe(true)
  })

  it('alt alan adlı adresi kabul eder', () => {
    expect(isPlausibleEmail('a@mail.example.co.uk')).toBe(true)
  })

  it('@ içermeyeni reddeder', () => {
    expect(isPlausibleEmail('mustafa.example.com')).toBe(false)
  })

  it('alan adı noktasız olanı reddeder', () => {
    expect(isPlausibleEmail('mustafa@localhost')).toBe(false)
  })

  it('boşluk içereni reddeder', () => {
    expect(isPlausibleEmail('mus tafa@example.com')).toBe(false)
  })

  it('boş dizeyi reddeder', () => {
    expect(isPlausibleEmail('')).toBe(false)
  })
})
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

```bash
npm test -w @sushi/identity-core
```

Beklenen: FAIL — `Failed to resolve import "../email-address"`.

- [ ] **Step 3: E-posta yardımcılarını yaz**

`packages/identity-core/src/email-address.ts`:

```ts
/**
 * E-posta adresi işlemleri.
 *
 * Doğrulama kasıtlı olarak gevşek. Bir adresin gerçekten teslim edilebilir
 * olduğunu ancak ona posta göndererek anlarsın — ki akış zaten bunu yapıyor.
 * Katı bir regex'in tek başarısı, geçerli ama sıra dışı adresleri olan
 * kullanıcıları dışarıda bırakmaktır.
 */

/** Karşılaştırma ve saklama için tek biçim. */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase()
}

/** Bariz çöp girdileri eler; teslim edilebilirlik iddiası taşımaz. */
export function isPlausibleEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
```

- [ ] **Step 4: Doğrulama deposu portunu tanımla**

`packages/identity-core/src/ports/verification-store.ts`:

```ts
/**
 * Tek kullanımlık token deposu. E-posta doğrulama ve parola sıfırlama
 * aynı şekli paylaşır, bu yüzden aynı arayüzü iki farklı tablo için iki
 * kez implemente ederiz.
 *
 * Yalnızca token'ın hash'i saklanır; ham token hiçbir zaman geri okunamaz.
 */
export interface VerificationStore {
  create(accountId: string, tokenHash: string, expiresAt: Date): Promise<void>

  /**
   * Token'ı harcar ve sahibinin hesap id'sini döner. Geçersiz, süresi
   * dolmuş veya daha önce harcanmış token için null.
   *
   * Harcama atomik olmalıdır: aynı token'la eşzamanlı iki istekten yalnızca
   * biri hesap id'si almalı.
   */
  consume(tokenHash: string, now: Date): Promise<string | null>
}
```

- [ ] **Step 5: Kayıt testini yaz**

`packages/identity-core/src/__tests__/register.test.ts`:

```ts
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
```

- [ ] **Step 6: Testi çalıştır, başarısız olduğunu gör**

```bash
npm test -w @sushi/identity-core
```

Beklenen: FAIL — `Failed to resolve import "../use-cases/register"`.

- [ ] **Step 7: Kayıt iş kuralını yaz**

`packages/identity-core/src/use-cases/register.ts`:

```ts
import { checkPassword, type PolicyViolation } from '../password-policy'
import { generateToken, hashToken } from '../tokens'
import { isPlausibleEmail, normalizeEmail } from '../email-address'
import type { AccountStore } from '../ports/account-store'
import type { BreachChecker } from '../password-policy'
import type { EmailSender } from '../ports/email-sender'
import type { PasswordHasher } from '../ports/password-hasher'
import type { VerificationStore } from '../ports/verification-store'

/** Doğrulama linki 24 saat geçerlidir. */
const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000

export interface RegisterInput {
  email: string
  password: string
  displayName: string | null
}

export interface RegisterDeps {
  accounts: AccountStore
  hasher: PasswordHasher
  breaches: BreachChecker
  email: EmailSender
  verifications: VerificationStore
  verificationUrl: (token: string) => string
  now: () => Date
}

export type RegisterResult =
  | { outcome: 'accepted' }
  | { outcome: 'rejected'; reason: 'invalid-email' | PolicyViolation }

/**
 * Yeni hesap açar.
 *
 * Adresin zaten kayıtlı olduğu durumda da 'accepted' döner ve hiçbir şey
 * yaratmaz — bunun yerine var olan adrese "birisi hesabınla kayıt olmaya
 * çalıştı" e-postası gider. Böylece cevap, adresin sistemde olup olmadığını
 * ele vermez; asıl sahibi ise durumdan haberdar olur.
 *
 * E-posta gönderimi başarısız olursa kayıt geri alınmaz: kullanıcının hesabı
 * durur ve doğrulamayı yeniden isteyebilir. Tersi, geçici bir posta arızasının
 * kullanıcıyı hesapsız bırakması demek olurdu.
 */
export async function register(
  input: RegisterInput,
  deps: RegisterDeps,
): Promise<RegisterResult> {
  const email = normalizeEmail(input.email)
  if (!isPlausibleEmail(email)) {
    return { outcome: 'rejected', reason: 'invalid-email' }
  }

  const violation = await checkPassword(input.password, deps.breaches)
  if (violation) return { outcome: 'rejected', reason: violation }

  const passwordHash = await deps.hasher.hash(input.password)
  const account = await deps.accounts.createWithPassword(
    { email, displayName: input.displayName },
    passwordHash,
  )

  if (!account) {
    await sendQuietly(deps, {
      to: email,
      subject: 'Sushi Systems hesabın zaten var',
      body:
        'Bu adresle bir hesap açılmaya çalışıldı, ama zaten bir hesabın var. ' +
        'Bunu sen yaptıysan giriş yapabilirsin; parolanı unuttuysan sıfırlama ' +
        'isteyebilirsin.',
    })
    return { outcome: 'accepted' }
  }

  const token = generateToken()
  await deps.verifications.create(
    account.id,
    await hashToken(token),
    new Date(deps.now().getTime() + VERIFICATION_TTL_MS),
  )

  await sendQuietly(deps, {
    to: email,
    subject: 'Hesabını doğrula',
    body:
      'Sushi Systems hesabını doğrulamak için bu bağlantıya git:\n\n' +
      `${deps.verificationUrl(token)}\n\n` +
      'Bağlantı 24 saat geçerli. Bu isteği sen yapmadıysan yok sayabilirsin.',
  })

  return { outcome: 'accepted' }
}

/** Gönderim hatası akışı durdurmaz — hesabın varlığı postadan önce gelir. */
async function sendQuietly(
  deps: RegisterDeps,
  email: Parameters<EmailSender['send']>[0],
): Promise<void> {
  try {
    await deps.email.send(email)
  } catch {
    // Yutuluyor: bkz. fonksiyon başlığındaki gerekçe.
  }
}
```

- [ ] **Step 8: Testi çalıştır, geçtiğini gör**

```bash
npm test -w @sushi/identity-core
```

Beklenen: 10 kayıt testi PASS.

- [ ] **Step 9: Doğrulama testini yaz**

`packages/identity-core/src/__tests__/verify-email.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { hashToken } from '../tokens'
import { verifyEmail, type VerifyEmailDeps } from '../use-cases/verify-email'

function makeDeps() {
  const verified: string[] = []
  const stored = new Map<string, string>()

  const deps: VerifyEmailDeps = {
    accounts: {
      findByEmail: async () => null,
      findById: async () => null,
      createWithPassword: async () => null,
      findIdentity: async () => null,
      findPasswordIdentity: async () => null,
      setPasswordHash: async () => {},
      markEmailVerified: async id => void verified.push(id),
    },
    verifications: {
      create: async (accountId, tokenHash) => void stored.set(tokenHash, accountId),
      consume: async tokenHash => {
        const accountId = stored.get(tokenHash)
        if (!accountId) return null
        stored.delete(tokenHash)  // tek kullanımlık
        return accountId
      },
    },
    now: () => new Date('2026-01-01T00:00:00Z'),
  }

  return { deps, verified, stored }
}

describe('verifyEmail', () => {
  it('geçerli token hesabı doğrulanmış işaretler', async () => {
    const { deps, verified } = makeDeps()
    await deps.verifications.create('hesap-1', await hashToken('token-abc'), new Date())
    expect(await verifyEmail('token-abc', deps)).toBe(true)
    expect(verified).toEqual(['hesap-1'])
  })

  it('geçersiz token için false döner ve hiçbir şeyi işaretlemez', async () => {
    const { deps, verified } = makeDeps()
    expect(await verifyEmail('olmayan-token', deps)).toBe(false)
    expect(verified).toEqual([])
  })

  it('aynı token ikinci kez kullanılamaz', async () => {
    const { deps, verified } = makeDeps()
    await deps.verifications.create('hesap-1', await hashToken('token-abc'), new Date())
    expect(await verifyEmail('token-abc', deps)).toBe(true)
    expect(await verifyEmail('token-abc', deps)).toBe(false)
    expect(verified).toEqual(['hesap-1'])
  })

  it('boş token için false döner', async () => {
    const { deps } = makeDeps()
    expect(await verifyEmail('', deps)).toBe(false)
  })
})
```

- [ ] **Step 10: Testi çalıştır, başarısız olduğunu gör**

```bash
npm test -w @sushi/identity-core
```

Beklenen: FAIL — `Failed to resolve import "../use-cases/verify-email"`.

- [ ] **Step 11: Doğrulama iş kuralını yaz**

`packages/identity-core/src/use-cases/verify-email.ts`:

```ts
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
```

- [ ] **Step 12: index.ts'ten dışa aktar**

`packages/identity-core/src/index.ts` sonuna ekle:

```ts
export { isPlausibleEmail, normalizeEmail } from './email-address'
export type { VerificationStore } from './ports/verification-store'
export {
  register,
  type RegisterDeps,
  type RegisterInput,
  type RegisterResult,
} from './use-cases/register'
export { verifyEmail, type VerifyEmailDeps } from './use-cases/verify-email'
```

- [ ] **Step 13: Testleri çalıştır**

```bash
npm test -w @sushi/identity-core
npm run typecheck
```

Beklenen: tüm testler PASS, tip kontrolü temiz.

- [ ] **Step 14: Commit**

```bash
git add packages/identity-core
git commit -m "feat: kayıt ve e-posta doğrulama iş kuralları"
```

---

### Task 7: Giriş, oturum ve parola sıfırlama iş kuralları

**Files:**
- Create: `packages/identity-core/src/ports/session-store.ts`
- Create: `packages/identity-core/src/use-cases/login.ts`
- Create: `packages/identity-core/src/use-cases/reset-password.ts`
- Test: `packages/identity-core/src/__tests__/login.test.ts`
- Test: `packages/identity-core/src/__tests__/reset-password.test.ts`
- Modify: `packages/identity-core/src/index.ts`

**Interfaces:**
- Consumes: `AccountStore`, `PasswordHasher`, `VerificationStore`, `EmailSender`, token yardımcıları
- Produces:
  - `interface SessionStore { create(accountId, tokenHash, expiresAt, userAgent): Promise<void>; findAccountId(tokenHash, now): Promise<string | null>; revoke(tokenHash): Promise<void>; revokeAllForAccount(accountId): Promise<void>; touch(tokenHash, expiresAt): Promise<void> }`
  - `login(input, deps): Promise<{ token: string } | null>`
  - `authenticate(token, deps): Promise<Account | null>`
  - `logout(token, deps): Promise<void>`
  - `requestPasswordReset(email, deps): Promise<void>`
  - `completePasswordReset(token, newPassword, deps): Promise<'ok' | 'invalid-token' | PolicyViolation>`

- [ ] **Step 1: Oturum deposu portunu tanımla**

`packages/identity-core/src/ports/session-store.ts`:

```ts
/**
 * Oturum deposu.
 *
 * Oturumlar veritabanında tutulur çünkü iptal edilebilir olmaları gerekir:
 * "tüm cihazlardan çık", parola sıfırlama sonrası zorunlu çıkış ve hesap
 * askıya alma, imzalı bir token'ın tek başına sunamayacağı şeyler.
 */
export interface SessionStore {
  create(
    accountId: string,
    tokenHash: string,
    expiresAt: Date,
    userAgent: string | null,
  ): Promise<void>

  /** Geçerli, süresi dolmamış ve iptal edilmemiş oturumun hesap id'si. */
  findAccountId(tokenHash: string, now: Date): Promise<string | null>

  revoke(tokenHash: string): Promise<void>
  revokeAllForAccount(accountId: string): Promise<void>

  /** Kullanımda oturumun ömrünü uzatır. */
  touch(tokenHash: string, expiresAt: Date): Promise<void>
}
```

- [ ] **Step 2: Giriş testini yaz**

`packages/identity-core/src/__tests__/login.test.ts`:

```ts
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
```

- [ ] **Step 3: Testi çalıştır, başarısız olduğunu gör**

```bash
npm test -w @sushi/identity-core
```

Beklenen: FAIL — `Failed to resolve import "../use-cases/login"`.

- [ ] **Step 4: Giriş iş kuralını yaz**

`packages/identity-core/src/use-cases/login.ts`:

```ts
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
const DUMMY_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$c2FsdHNhbHRzYWx0c2E$0000000000000000000000000000000000000000000'

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

  const identity = account
    ? await deps.accounts.findPasswordIdentity(account.id)
    : null

  // Hesap yoksa da doğrulama koşar: aksi hâlde cevap süresi hesabın
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
  deps: LoginDeps,
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

export async function logout(token: string, deps: LoginDeps): Promise<void> {
  if (!token) return
  await deps.sessions.revoke(await hashToken(token))
}
```

- [ ] **Step 5: Testi çalıştır, geçtiğini gör**

```bash
npm test -w @sushi/identity-core
```

Beklenen: 12 giriş/oturum testi PASS.

- [ ] **Step 6: Parola sıfırlama testini yaz**

`packages/identity-core/src/__tests__/reset-password.test.ts`:

```ts
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
```

- [ ] **Step 7: Testi çalıştır, başarısız olduğunu gör**

```bash
npm test -w @sushi/identity-core
```

Beklenen: FAIL — `Failed to resolve import "../use-cases/reset-password"`.

- [ ] **Step 8: Parola sıfırlama iş kuralını yaz**

`packages/identity-core/src/use-cases/reset-password.ts`:

```ts
import { checkPassword, type BreachChecker, type PolicyViolation } from '../password-policy'
import { generateToken, hashToken } from '../tokens'
import { normalizeEmail } from '../email-address'
import type { AccountStore } from '../ports/account-store'
import type { EmailSender } from '../ports/email-sender'
import type { PasswordHasher } from '../ports/password-hasher'
import type { SessionStore } from '../ports/session-store'
import type { VerificationStore } from '../ports/verification-store'

/** Sıfırlama linki 1 saat geçerli — doğrulamadan kısa, çünkü riski yüksek. */
const RESET_TTL_MS = 60 * 60 * 1000

export interface ResetDeps {
  accounts: AccountStore
  hasher: PasswordHasher
  breaches: BreachChecker
  email: EmailSender
  resets: VerificationStore
  sessions: SessionStore
  resetUrl: (token: string) => string
  now: () => Date
}

/**
 * Sıfırlama linki ister.
 *
 * Adres kayıtlı değilse hiçbir şey yapmaz ve yine de normal döner — çağıran
 * her durumda aynı cevabı verebilsin diye. Adresin sistemde olup olmadığı
 * dışarıdan ayırt edilememelidir.
 */
export async function requestPasswordReset(
  rawEmail: string,
  deps: ResetDeps,
): Promise<void> {
  const email = normalizeEmail(rawEmail)
  const account = await deps.accounts.findByEmail(email)
  if (!account) return

  const token = generateToken()
  await deps.resets.create(
    account.id,
    await hashToken(token),
    new Date(deps.now().getTime() + RESET_TTL_MS),
  )

  try {
    await deps.email.send({
      to: email,
      subject: 'Parolanı sıfırla',
      body:
        'Parolanı sıfırlamak için bu bağlantıya git:\n\n' +
        `${deps.resetUrl(token)}\n\n` +
        'Bağlantı 1 saat geçerli. Bu isteği sen yapmadıysan yok sayabilirsin; ' +
        'parolan değişmez.',
    })
  } catch {
    // Gönderim hatası çağırana sızmaz — hangi adreslerin var olduğunu
    // hata mesajından çıkarmak mümkün olmamalı.
  }
}

/**
 * Sıfırlamayı tamamlar.
 *
 * Parola politikası token harcanmadan ÖNCE kontrol edilir: kullanıcı zayıf
 * bir parola denediği için linkini kaybetmemeli.
 */
export async function completePasswordReset(
  token: string,
  newPassword: string,
  deps: ResetDeps,
): Promise<'ok' | 'invalid-token' | PolicyViolation> {
  if (!token) return 'invalid-token'

  const violation = await checkPassword(newPassword, deps.breaches)
  if (violation) return violation

  const accountId = await deps.resets.consume(await hashToken(token), deps.now())
  if (!accountId) return 'invalid-token'

  await deps.accounts.setPasswordHash(
    accountId,
    await deps.hasher.hash(newPassword),
  )

  // Sıfırlamanın yaygın sebebi hesabın ele geçirilmiş olması; mevcut tüm
  // oturumların düşmesi gerekir.
  await deps.sessions.revokeAllForAccount(accountId)

  return 'ok'
}
```

- [ ] **Step 9: index.ts'ten dışa aktar**

`packages/identity-core/src/index.ts` sonuna ekle:

```ts
export type { SessionStore } from './ports/session-store'
export {
  authenticate,
  login,
  logout,
  type LoginDeps,
  type LoginInput,
} from './use-cases/login'
export {
  completePasswordReset,
  requestPasswordReset,
  type ResetDeps,
} from './use-cases/reset-password'
```

- [ ] **Step 10: Tüm testleri çalıştır**

```bash
npm test -w @sushi/identity-core
npm test -w @sushi/identity-infra
npm run typecheck
```

Beklenen: hepsi PASS, tip kontrolü temiz, mimari testi hâlâ geçiyor (yeni dosyaların hiçbiri `node:` veya bare specifier import etmiyor).

- [ ] **Step 11: Commit**

```bash
git add packages/identity-core
git commit -m "feat: giriş, oturum ve parola sıfırlama iş kuralları"
```

---

## Plan 2 Sonu — Neyin Bittiği

Kayıt, e-posta doğrulama, giriş, oturum çözümleme, çıkış ve parola sıfırlama, tamamı test edilmiş fonksiyonlar olarak çalışıyor. Hiçbiri HTTP bilmiyor, hiçbiri Next.js'e bağlı değil, çoğunun testi veritabanı olmadan koşuyor.

Henüz kimse tarayıcıdan giriş yapamaz — o Plan 3'ün işi.

Eksik kalan adaptörler bilinçli olarak Plan 3'e bırakıldı: `VerificationStore` ve `SessionStore`'un Postgres implementasyonları orada yazılacak, çünkü ikisi de yalnızca web katmanı tarafından kullanılıyor ve sözleşmeleri Plan 3'ün ihtiyaçlarıyla birlikte netleşecek.

## Sonraki Planlar

- **Plan 3 — `apps/accounts`:** Next.js iskeleti, `VerificationStore` ve `SessionStore` Postgres adaptörleri, HTTP uçları, cookie yönetimi, Postgres tabanlı hız sınırlama, ve kayıt/giriş/doğrulama/sıfırlama ekranları.
- **Plan 4 — Yetkilendirme:** `can()`, `GrantReader`, Postgres ve bellek implementasyonları.
- **Plan 5 — Google ile giriş:** OAuth 2.0 + PKCE, hesap bağlama kuralı, hesap ayarları.
- **Plan 6 — Kuruluşlar ve davetler.**
- **Plan 7 — JWT ve JWKS.**
