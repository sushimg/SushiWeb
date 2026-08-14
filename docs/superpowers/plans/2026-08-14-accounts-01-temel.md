# Sushi Accounts — Plan 1: Monorepo Temeli ve Çekirdek

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** sushiweb'i npm workspaces monorepo'suna çevirmek, bağımlılığı sıfır olan `@sushi/identity-core` paketini kurmak, veritabanı şemasını ve migration altyapısını oluşturmak.

**Architecture:** Hexagonal (ports & adapters). `identity-core` saf domain — Node, Postgres veya framework import etmez, yalnızca Web Crypto kullanır. Dış dünya ihtiyaçları port (TypeScript interface) olarak tanımlanır, gerçek implementasyonlar `identity-infra`'da yaşar. Bu kural bir test tarafından zorlanır.

**Tech Stack:** npm workspaces (Node 24, npm 11), TypeScript 6, Vitest 4, Neon Postgres (`@neondatabase/serverless`), Next.js 16 (Plan 2'de), Vite 8 (mevcut site).

**Spec:** `docs/superpowers/specs/2026-08-14-sushi-accounts-design.md`

## Global Constraints

- `packages/identity-core/package.json` içindeki `dependencies` alanı **boş kalmalıdır**. Test bunu zorlar.
- `identity-core` kaynak dosyaları `node:` ile başlayan hiçbir modülü import edemez. Kriptografi için yalnızca Web Crypto (`crypto.subtle`, `crypto.getRandomValues`) kullanılır.
- Hiçbir token veritabanına ham hâlde yazılmaz. Yalnızca SHA-256 hash'i saklanır.
- E-posta sütunları `citext`; büyük/küçük harf duyarsız benzersizlik zorunlu.
- Paket isimleri: `@sushi/identity-core`, `@sushi/identity-infra`, `@sushi/identity-client`.
- Tüm SQL migration dosyaları elle yazılır ve `db/migrations/NNNN_ad.sql` biçiminde numaralandırılır. ORM kullanılmaz.
- Test komutu her yerde `npm test -w <paket>`; test runner Vitest.
- Commit mesajları Türkçe gövde, İngilizce conventional prefix (`feat:`, `test:`, `chore:`).

---

### Task 1: Monorepo iskeleti ve sitenin apps/web'e taşınması

**Files:**
- Create: `package.json` (kök, workspaces tanımı — mevcut dosyanın yerini alır)
- Create: `apps/web/package.json`
- Move: `src/`, `index.html`, `public/`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `vercel.json`, `.env`, `.env.example` → `apps/web/`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: yok (ilk task)
- Produces: `apps/web` workspace'i; kökten `npm run dev -w apps/web` ve `npm run build -w apps/web` çalışır.

- [ ] **Step 1: Dosyaları git ile taşı**

`git mv` kullan — geçmiş korunur ve Git taşımayı yeniden adlandırma olarak görür.

```bash
mkdir -p apps/web
git mv src index.html public vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json eslint.config.js vercel.json apps/web/
git mv .env.example apps/web/.env.example
mv .env apps/web/.env 2>/dev/null || true
git mv project-mobilerts-privacy-policy.html apps/web/ 2>/dev/null || true
```

`_framer_backup/`, `dist/` ve `node_modules/` taşınmaz — ilki gitignore'da, diğerleri türetilmiş.

- [ ] **Step 2: apps/web/package.json oluştur**

Mevcut kök `package.json`'daki bağımlılıkların tamamı buraya taşınır.

```json
{
  "name": "@sushi/web",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "framer-motion": "^12.40.0",
    "react": "^19.2.6",
    "react-dom": "^19.2.6",
    "react-router-dom": "^7.17.0"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@tailwindcss/vite": "^4.3.0",
    "@types/node": "^24.12.3",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "eslint": "^10.3.0",
    "eslint-plugin-react-hooks": "^7.1.1",
    "eslint-plugin-react-refresh": "^0.5.2",
    "globals": "^17.6.0",
    "playwright": "^1.60.0",
    "tailwindcss": "^4.3.0",
    "typescript": "~6.0.2",
    "typescript-eslint": "^8.59.2",
    "vite": "^8.0.12"
  }
}
```

- [ ] **Step 3: Kök package.json'ı workspace köküne dönüştür**

Kök artık uygulama değil, sadece workspace tanımı ve ortak script'ler barındırır.

```json
{
  "name": "sushiweb",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "npm run dev -w @sushi/web",
    "build": "npm run build --workspaces --if-present",
    "test": "npm run test --workspaces --if-present",
    "lint": "npm run lint --workspaces --if-present"
  }
}
```

- [ ] **Step 4: .gitignore'a build çıktılarını ekle**

Mevcut dosyanın sonuna ekle:

```gitignore
# Workspace build çıktıları
apps/*/dist
apps/*/.next
packages/*/dist
```

- [ ] **Step 5: Bağımlılıkları yeniden kur ve build'i doğrula**

```bash
rm -rf node_modules package-lock.json
npm install
npm run build -w @sushi/web
```

Beklenen: `apps/web/dist/` oluşur, TypeScript hatası yok. Hata alırsan sebebi büyük olasılıkla `apps/web/tsconfig.json` içindeki göreli yollardır — `include` alanı `src`'yi işaret etmeli ve `src` artık `apps/web/src` altında olduğu için değişiklik gerekmez.

- [ ] **Step 6: Dev sunucusunu bir kez elle çalıştır ve siteyi gör**

```bash
npm run dev -w @sushi/web
```

Tarayıcıda açılan adresi ziyaret et, ana sayfanın taşımadan önceki gibi göründüğünü doğrula, sonra sunucuyu kapat. Bu adım otomatik test değil — taşımanın görsel bir şeyi bozmadığını gözle doğrulamak için var.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: monorepo yapısına geç, siteyi apps/web altına taşı"
```

- [ ] **Step 8: Vercel Root Directory ayarını değiştir — bu adım kullanıcıya aittir**

Kullanıcıya şunu söyle ve **onay alana kadar devam etme**: Vercel panelinde sushiweb projesini aç, Settings → Build and Deployment → Root Directory alanını `apps/web` yap ve kaydet. Bu yapılmadan bir sonraki deploy başarısız olur.

---

### Task 2: identity-core paketi ve mimari testi

**Files:**
- Create: `packages/identity-core/package.json`
- Create: `packages/identity-core/tsconfig.json`
- Create: `packages/identity-core/vitest.config.ts`
- Create: `packages/identity-core/src/index.ts`
- Test: `packages/identity-core/src/__tests__/architecture.test.ts`

**Interfaces:**
- Consumes: Task 1'in workspace yapısı
- Produces: `@sushi/identity-core` paketi; `npm test -w @sushi/identity-core` çalışır.

- [ ] **Step 1: Paket dosyalarını oluştur**

`packages/identity-core/package.json` — `dependencies` alanının kasıtlı olarak boş olduğuna dikkat:

```json
{
  "name": "@sushi/identity-core",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "main": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {},
  "devDependencies": {
    "typescript": "~6.0.2",
    "vitest": "^4.1.10"
  }
}
```

`packages/identity-core/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es2023",
    "lib": ["ES2023", "DOM"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noUncheckedIndexedAccess": true,
    "erasableSyntaxOnly": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["vitest/globals"]
  },
  "include": ["src"]
}
```

`"lib": ["ES2023", "DOM"]` seçimi bilinçli: `DOM`, Web Crypto tiplerini (`crypto.subtle`) getirir; `node` tipleri kasıtlı olarak dışarıda bırakılır ki `node:` importları derlemede zaten çözülemesin.

`packages/identity-core/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: { globals: true, environment: 'node' },
})
```

`packages/identity-core/src/index.ts`:

```ts
export const PACKAGE_NAME = '@sushi/identity-core'
```

- [ ] **Step 2: Mimari testini yaz**

Bu test, spec'teki "çekirdek bağımsız kalmalı" kuralını belgeye değil araca dayatır.

`packages/identity-core/src/__tests__/architecture.test.ts`:

```ts
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Bu TEST dosyası node: kullanabilir — kural kaynak dosyalar için geçerli.
const SRC = join(import.meta.dirname, '..')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(entry => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      return entry === '__tests__' ? [] : sourceFiles(full)
    }
    return full.endsWith('.ts') ? [full] : []
  })
}

describe('identity-core bağımsızlığı', () => {
  it('package.json içinde hiçbir çalışma zamanı bağımlılığı yoktur', () => {
    const pkg = JSON.parse(
      readFileSync(join(SRC, '..', 'package.json'), 'utf8'),
    ) as { dependencies?: Record<string, string> }
    expect(Object.keys(pkg.dependencies ?? {})).toEqual([])
  })

  it('hiçbir kaynak dosya node: modülü import etmez', () => {
    const offenders = sourceFiles(SRC).filter(file =>
      /from\s+['"]node:/.test(readFileSync(file, 'utf8')),
    )
    expect(offenders).toEqual([])
  })

  it('hiçbir kaynak dosya paket dışından import etmez', () => {
    // Yalnızca göreli importlara izin verilir. Bare specifier ('pg', 'next/…')
    // görüldüğü an çekirdek bir çalışma zamanına bağlanmış demektir.
    const bare = /from\s+['"](?![./])/
    const offenders = sourceFiles(SRC).filter(file =>
      bare.test(readFileSync(file, 'utf8')),
    )
    expect(offenders).toEqual([])
  })
})
```

- [ ] **Step 3: Testi çalıştır, geçtiğini gör**

```bash
npm install
npm test -w @sushi/identity-core
```

Beklenen: 3 test PASS. (Bu test kasıtlı olarak baştan geçer — bir regresyon bekçisi, bir özellik testi değil.)

- [ ] **Step 4: Testin gerçekten koruduğunu doğrula**

`src/index.ts`'in başına geçici olarak `import { readFileSync } from 'node:fs'` satırını ekle ve testi tekrar çalıştır.

Beklenen: "hiçbir kaynak dosya node: modülü import etmez" testi FAIL. Bunu gördükten sonra satırı sil ve testin yeniden geçtiğini doğrula.

Bu adımı atlama: hiçbir zaman başarısız olduğunu görmediğin bir test, aslında hiçbir şeyi test etmiyor olabilir.

- [ ] **Step 5: Commit**

```bash
git add packages/identity-core package-lock.json
git commit -m "feat: identity-core paketi ve bağımsızlığını zorlayan mimari test"
```

---

### Task 3: Token üretimi ve hash'leme

**Files:**
- Create: `packages/identity-core/src/tokens.ts`
- Test: `packages/identity-core/src/__tests__/tokens.test.ts`
- Modify: `packages/identity-core/src/index.ts`

**Interfaces:**
- Consumes: Task 2'nin paket iskeleti
- Produces:
  - `generateToken(): string` — 32 bayt rastgeleden üretilmiş base64url dize
  - `hashToken(token: string): Promise<string>` — SHA-256, küçük harfli hex
  - `constantTimeEqual(a: string, b: string): boolean`

- [ ] **Step 1: Başarısız testi yaz**

`packages/identity-core/src/__tests__/tokens.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { constantTimeEqual, generateToken, hashToken } from '../tokens'

describe('generateToken', () => {
  it('URL-güvenli karakterlerden oluşur', () => {
    expect(generateToken()).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('en az 32 baytlık entropi taşır', () => {
    // base64url'de 32 bayt = 43 karakter (padding'siz).
    expect(generateToken().length).toBeGreaterThanOrEqual(43)
  })

  it('her çağrıda farklı bir değer üretir', () => {
    const seen = new Set(Array.from({ length: 100 }, () => generateToken()))
    expect(seen.size).toBe(100)
  })
})

describe('hashToken', () => {
  it('SHA-256 hex özeti döner', async () => {
    // 'abc' için bilinen SHA-256 değeri.
    expect(await hashToken('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
  })

  it('aynı girdi için aynı çıktıyı verir', async () => {
    expect(await hashToken('sushi')).toBe(await hashToken('sushi'))
  })

  it('farklı girdiler için farklı çıktı verir', async () => {
    expect(await hashToken('a')).not.toBe(await hashToken('b'))
  })
})

describe('constantTimeEqual', () => {
  it('aynı dizeler için true döner', () => {
    expect(constantTimeEqual('abc', 'abc')).toBe(true)
  })

  it('farklı dizeler için false döner', () => {
    expect(constantTimeEqual('abc', 'abd')).toBe(false)
  })

  it('farklı uzunluklar için false döner', () => {
    expect(constantTimeEqual('abc', 'abcd')).toBe(false)
  })
})
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

```bash
npm test -w @sushi/identity-core
```

Beklenen: FAIL — `Failed to resolve import "../tokens"`.

- [ ] **Step 3: Minimal implementasyonu yaz**

`packages/identity-core/src/tokens.ts`:

```ts
/**
 * Tek kullanımlık token'lar: oturum, e-posta doğrulama, parola sıfırlama,
 * davet. Hepsi aynı şekli paylaşır — yüksek entropili rastgele bir dize
 * kullanıcıya gider, yalnızca SHA-256 özeti veritabanında durur.
 *
 * Parolalardan farklı olarak burada Argon2 gerekmez: token'lar zaten 256 bit
 * rastgele, yani sözlük saldırısına konu değiller. Yavaş hash, kazanç
 * sağlamadan her istek doğrulamasını yavaşlatırdı.
 */

const TOKEN_BYTES = 32

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Kullanıcıya gidecek ham token. Asla saklanmaz. */
export function generateToken(): string {
  const bytes = new Uint8Array(TOKEN_BYTES)
  crypto.getRandomValues(bytes)
  return toBase64Url(bytes)
}

/** Veritabanına yazılacak biçim. */
export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(token),
  )
  return [...new Uint8Array(digest)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Karşılaştırmanın ne kadarında eşleştiğini sızdırmadan karşılaştırır.
 * Düz === ilk farklı baytta durur ve durduğu ana kadar geçen süre, doğru
 * önekin uzunluğunun ölçümüdür.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
```

- [ ] **Step 4: index.ts'ten dışa aktar**

`packages/identity-core/src/index.ts` içeriğini şununla değiştir:

```ts
export { constantTimeEqual, generateToken, hashToken } from './tokens'
```

- [ ] **Step 5: Testi çalıştır, geçtiğini gör**

```bash
npm test -w @sushi/identity-core
```

Beklenen: tokens testlerinin tamamı PASS, mimari testleri hâlâ PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/identity-core
git commit -m "feat: token üretimi, SHA-256 hash'leme ve sabit zamanlı karşılaştırma"
```

---

### Task 4: Parola politikası

**Files:**
- Create: `packages/identity-core/src/password-policy.ts`
- Test: `packages/identity-core/src/__tests__/password-policy.test.ts`
- Modify: `packages/identity-core/src/index.ts`

**Interfaces:**
- Consumes: Task 3'ün paket yapısı
- Produces:
  - `type PolicyViolation = 'too-short' | 'too-long' | 'breached'`
  - `checkPasswordPolicy(password: string): PolicyViolation | null` — yerel kurallar
  - `interface BreachChecker { isBreached(password: string): Promise<boolean> }` — port
  - `checkPassword(password: string, breaches: BreachChecker): Promise<PolicyViolation | null>`

Sızmış parola kontrolünün gerçek implementasyonu ağa çıkar, dolayısıyla `identity-infra`'ya aittir (Plan 2). Burada yalnızca port ve onu kullanan saf kural tanımlanır.

- [ ] **Step 1: Başarısız testi yaz**

`packages/identity-core/src/__tests__/password-policy.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  checkPassword,
  checkPasswordPolicy,
  type BreachChecker,
} from '../password-policy'

const neverBreached: BreachChecker = { isBreached: async () => false }
const alwaysBreached: BreachChecker = { isBreached: async () => true }

describe('checkPasswordPolicy', () => {
  it('12 karakterden kısa parolayı reddeder', () => {
    expect(checkPasswordPolicy('kisa123')).toBe('too-short')
  })

  it('tam 12 karakteri kabul eder', () => {
    expect(checkPasswordPolicy('123456789012')).toBeNull()
  })

  it('72 bayttan uzun parolayı reddeder', () => {
    // Üst sınır keyfi değil: Argon2 öncesi girdi boyutunu sınırlamak,
    // devasa parolalarla CPU tüketen bir saldırı yüzeyini kapatır.
    expect(checkPasswordPolicy('a'.repeat(73))).toBe('too-long')
  })

  it('uzunluğu bayt cinsinden ölçer, karakter cinsinden değil', () => {
    // Her emoji 4 bayt: 19 emoji = 76 bayt ama yalnızca 19 kod noktası.
    expect(checkPasswordPolicy('🍣'.repeat(19))).toBe('too-long')
  })

  it('kısa ama çok baytlı parolayı doğru sayar', () => {
    // 4 emoji = 16 bayt, ama 12 karakterlik alt sınırı bayt üzerinden geçer.
    expect(checkPasswordPolicy('🍣'.repeat(4))).toBeNull()
  })
})

describe('checkPassword', () => {
  it('yerel kural ihlalinde sızıntı kontrolüne hiç gitmez', async () => {
    let called = false
    const spy: BreachChecker = {
      isBreached: async () => {
        called = true
        return false
      },
    }
    expect(await checkPassword('kisa', spy)).toBe('too-short')
    expect(called).toBe(false)
  })

  it('sızmış parolayı reddeder', async () => {
    expect(await checkPassword('parolam123456', alwaysBreached)).toBe('breached')
  })

  it('geçerli ve sızmamış parolayı kabul eder', async () => {
    expect(await checkPassword('parolam123456', neverBreached)).toBeNull()
  })
})
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

```bash
npm test -w @sushi/identity-core
```

Beklenen: FAIL — `Failed to resolve import "../password-policy"`.

- [ ] **Step 3: Minimal implementasyonu yaz**

`packages/identity-core/src/password-policy.ts`:

```ts
/**
 * Parola kuralları. Yerel olarak karar verilebilenler saf fonksiyonda,
 * ağa çıkmayı gerektiren sızıntı kontrolü ise port arkasında durur.
 *
 * Sıralama önemli: ucuz ve kesin olan kontroller önce koşar, böylece
 * geçersiz bir parola için ağ isteği hiç yapılmaz.
 */

export type PolicyViolation = 'too-short' | 'too-long' | 'breached'

const MIN_BYTES = 12
const MAX_BYTES = 72

/**
 * Sızmış parola veri tabanına soran port. Gerçek implementasyonu
 * identity-infra'da; çekirdek yalnızca cevabı bilir, nereden geldiğini değil.
 */
export interface BreachChecker {
  isBreached(password: string): Promise<boolean>
}

/** Ağ gerektirmeyen kurallar. */
export function checkPasswordPolicy(password: string): PolicyViolation | null {
  const bytes = new TextEncoder().encode(password).length
  if (bytes < MIN_BYTES) return 'too-short'
  if (bytes > MAX_BYTES) return 'too-long'
  return null
}

/** Tüm kurallar. Yerel kural ihlal edilmişse ağa çıkılmaz. */
export async function checkPassword(
  password: string,
  breaches: BreachChecker,
): Promise<PolicyViolation | null> {
  const local = checkPasswordPolicy(password)
  if (local) return local
  return (await breaches.isBreached(password)) ? 'breached' : null
}
```

- [ ] **Step 4: index.ts'ten dışa aktar**

`packages/identity-core/src/index.ts`:

```ts
export { constantTimeEqual, generateToken, hashToken } from './tokens'
export {
  checkPassword,
  checkPasswordPolicy,
  type BreachChecker,
  type PolicyViolation,
} from './password-policy'
```

- [ ] **Step 5: Testi çalıştır, geçtiğini gör**

```bash
npm test -w @sushi/identity-core
```

Beklenen: tüm testler PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/identity-core
git commit -m "feat: parola politikası ve sızıntı kontrolü portu"
```

---

### Task 5: Veritabanı şeması

**Files:**
- Create: `db/migrations/0001_identity.sql`
- Create: `db/migrations/0002_seed_roles.sql`
- Create: `packages/identity-infra/package.json`
- Create: `packages/identity-infra/src/db/env.ts`
- Create: `packages/identity-infra/src/db/client.ts`
- Create: `packages/identity-infra/src/db/migrate.ts`
- Test: `packages/identity-infra/src/db/__tests__/env.test.ts`
- Create: `docs/database-setup.md`

**Interfaces:**
- Consumes: yok (bağımsız)
- Produces:
  - `readDatabaseUrl(source: Record<string, string | undefined>): string`
  - `sql(): NeonQueryFunction<false, false>` — tagged template sorgu fonksiyonu
  - `resetDbClient(): void` — test dikişi
  - `npm run migrate -w @sushi/identity-infra` komutu

- [ ] **Step 1: Şema migration'ını yaz**

`db/migrations/0001_identity.sql`:

```sql
-- Sushi Systems Accounts — çekirdek kimlik şeması.
-- Spec: docs/superpowers/specs/2026-08-14-sushi-accounts-design.md

create extension if not exists citext;
create extension if not exists pgcrypto;  -- gen_random_uuid için

-- KİMLİK ---------------------------------------------------------------

create table accounts (
  id             uuid primary key default gen_random_uuid(),
  email          citext not null unique,
  email_verified boolean not null default false,
  display_name   text,
  status         text not null default 'active',
  created_at     timestamptz not null default now(),
  constraint accounts_status_valid
    check (status in ('active', 'suspended', 'deleted'))
);

create table identities (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references accounts(id) on delete cascade,
  provider    text not null,
  subject     text not null,
  secret_hash text,
  created_at  timestamptz not null default now(),
  unique (provider, subject),
  constraint identities_provider_valid
    check (provider in ('password', 'google')),
  -- Parola kimliğinin hash'i olmak zorunda; Google kimliğinin olmamalı.
  constraint identities_secret_matches_provider check (
    (provider = 'password' and secret_hash is not null) or
    (provider <> 'password' and secret_hash is null)
  )
);

create index identities_account_idx on identities(account_id);

-- KAPSAMLAR ------------------------------------------------------------

create table organizations (
  id         uuid primary key default gen_random_uuid(),
  slug       citext not null unique,
  name       text not null,
  created_at timestamptz not null default now()
);

create table products (
  id         uuid primary key default gen_random_uuid(),
  slug       citext not null unique,
  name       text not null,
  created_at timestamptz not null default now()
);

-- YETKİ ----------------------------------------------------------------

create table permissions (
  key         text primary key,
  description text not null
);

create table roles (
  id         uuid primary key default gen_random_uuid(),
  scope_type text not null,
  key        text not null,
  name       text not null,
  unique (scope_type, key),
  constraint roles_scope_valid check (scope_type in ('org', 'product'))
);

create table role_permissions (
  role_id        uuid not null references roles(id) on delete cascade,
  permission_key text not null references permissions(key) on delete cascade,
  primary key (role_id, permission_key)
);

-- Sistemin kalbi: "şu hesap, şu kapsamda, şu role sahip."
create table grants (
  id         uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  scope_type text not null,
  scope_id   uuid not null,
  role_id    uuid not null references roles(id),
  granted_at timestamptz not null default now(),
  unique (account_id, scope_type, scope_id, role_id),
  constraint grants_scope_valid check (scope_type in ('org', 'product'))
);

-- Yetki sorgusu her istekte koşar; kapsam bazlı arama için indeks şart.
create index grants_lookup_idx on grants(account_id, scope_type, scope_id);
create index grants_scope_idx on grants(scope_type, scope_id);

-- OTURUM VE TOKEN'LAR --------------------------------------------------
-- Hiçbir token ham hâlde saklanmaz; yalnızca SHA-256 özeti.

create table sessions (
  id         uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  user_agent text,
  created_at timestamptz not null default now()
);

create index sessions_account_idx on sessions(account_id);

create table email_verifications (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references accounts(id) on delete cascade,
  token_hash  text not null unique,
  expires_at  timestamptz not null,
  consumed_at timestamptz,
  created_at  timestamptz not null default now()
);

create table password_resets (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references accounts(id) on delete cascade,
  token_hash  text not null unique,
  expires_at  timestamptz not null,
  consumed_at timestamptz,
  created_at  timestamptz not null default now()
);

create table invitations (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  email       citext not null,
  role_id     uuid not null references roles(id),
  token_hash  text not null unique,
  invited_by  uuid not null references accounts(id),
  expires_at  timestamptz not null,
  accepted_at timestamptz,
  created_at  timestamptz not null default now()
);

-- Aynı adrese iki BEKLEYEN davet olamaz; kişi ayrıldıktan sonra tekrar
-- davet edilebilir. Yarış durumunda bile bozulamayacak tek yer burası.
create unique index invitations_pending_idx
  on invitations(org_id, email) where accepted_at is null;

create table rate_limits (
  bucket       text not null,
  subject      text not null,
  window_start timestamptz not null,
  count        integer not null default 0,
  primary key (bucket, subject, window_start)
);
```

- [ ] **Step 2: Başlangıç rol ve izin verisini yaz**

`db/migrations/0002_seed_roles.sql`:

```sql
-- Roller ve izinler veri olarak durur. Yeni rol eklemek = yeni satır.
-- Kod hiçbir yerde rol ismine bakmaz, yalnızca izin sorar.

insert into permissions (key, description) values
  ('org.read',          'Kuruluşu ve üye listesini görüntüler'),
  ('org.member.invite', 'Kuruluşa yeni üye davet eder'),
  ('org.member.remove', 'Kuruluştan üye çıkarır'),
  ('org.role.assign',   'Kuruluş üyelerinin rolünü değiştirir'),
  ('org.delete',        'Kuruluşu siler'),
  ('product.play',      'Ürünü çalıştırır'),
  ('product.manage',    'Ürün ayarlarını yönetir')
on conflict (key) do nothing;

insert into roles (scope_type, key, name) values
  ('org',     'owner',  'Sahip'),
  ('org',     'admin',  'Yönetici'),
  ('org',     'member', 'Üye'),
  ('product', 'owner',  'Ürün Sahibi'),
  ('product', 'player', 'Oyuncu')
on conflict (scope_type, key) do nothing;

insert into role_permissions (role_id, permission_key)
select r.id, p.key
from roles r
join permissions p on true
where (r.scope_type, r.key) = ('org', 'owner')
  and p.key in ('org.read', 'org.member.invite', 'org.member.remove',
                'org.role.assign', 'org.delete')
on conflict do nothing;

insert into role_permissions (role_id, permission_key)
select r.id, p.key
from roles r
join permissions p on true
where (r.scope_type, r.key) = ('org', 'admin')
  and p.key in ('org.read', 'org.member.invite', 'org.member.remove')
on conflict do nothing;

insert into role_permissions (role_id, permission_key)
select r.id, 'org.read' from roles r
where (r.scope_type, r.key) = ('org', 'member')
on conflict do nothing;

insert into role_permissions (role_id, permission_key)
select r.id, p.key
from roles r
join permissions p on true
where (r.scope_type, r.key) = ('product', 'owner')
  and p.key in ('product.play', 'product.manage')
on conflict do nothing;

insert into role_permissions (role_id, permission_key)
select r.id, 'product.play' from roles r
where (r.scope_type, r.key) = ('product', 'player')
on conflict do nothing;
```

- [ ] **Step 3: identity-infra paketini oluştur**

`packages/identity-infra/package.json`:

```json
{
  "name": "@sushi/identity-infra",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "main": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "test": "vitest run",
    "migrate": "node --env-file=../../.env.local --experimental-strip-types src/db/migrate.ts"
  },
  "dependencies": {
    "@neondatabase/serverless": "^1.1.0",
    "@sushi/identity-core": "*"
  },
  "devDependencies": {
    "@types/node": "^24.12.3",
    "@types/pg": "^8.11.10",
    "pg": "^8.13.1",
    "typescript": "~6.0.2",
    "vitest": "^4.1.10"
  }
}
```

- [ ] **Step 4: env okuyucusunun başarısız testini yaz**

`packages/identity-infra/src/db/__tests__/env.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { readDatabaseUrl } from '../env'

describe('readDatabaseUrl', () => {
  it('geçerli bağlantı dizesini döner', () => {
    const url = 'postgresql://user:pw@host/db'
    expect(readDatabaseUrl({ DATABASE_URL: url })).toBe(url)
  })

  it('postgres:// önekini de kabul eder', () => {
    const url = 'postgres://user:pw@host/db'
    expect(readDatabaseUrl({ DATABASE_URL: url })).toBe(url)
  })

  it('değişken yoksa kurulum dokümanını gösteren hata verir', () => {
    expect(() => readDatabaseUrl({})).toThrow(/database-setup/)
  })

  it('yanlış önekli değeri reddeder', () => {
    // Yanlış sırrı yapıştırmak, aksi hâlde çok sonra ve hiçbir değişken
    // adı içermeyen bir bağlantı hatasıyla patlar.
    expect(() => readDatabaseUrl({ DATABASE_URL: 'vercel_blob_rw_xxx' }))
      .toThrow(/postgresql:\/\//)
  })
})
```

- [ ] **Step 5: Testi çalıştır, başarısız olduğunu gör**

```bash
npm install
npm test -w @sushi/identity-infra
```

Beklenen: FAIL — `Failed to resolve import "../env"`.

- [ ] **Step 6: env ve client'ı yaz**

`packages/identity-infra/src/db/env.ts`:

```ts
/**
 * Bağlantı dizesini okur. process.env'i doğrudan okumak yerine ortamı
 * argüman olarak alır — böylece her hata yolu, global durum değiştirmeden
 * test edilebilir.
 */
export function readDatabaseUrl(
  source: Record<string, string | undefined>,
): string {
  const url = source.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL tanımlı değil. Bkz. docs/database-setup.md')
  }
  if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
    throw new Error(
      'DATABASE_URL postgresql:// ile başlamalı — bkz. docs/database-setup.md',
    )
  }
  return url
}
```

`packages/identity-infra/src/db/client.ts`:

```ts
import { neon, type NeonQueryFunction } from '@neondatabase/serverless'
import { readDatabaseUrl } from './env'

let client: NeonQueryFunction<false, false> | null = null

/**
 * Etiketli şablon sorgu fonksiyonu. İlk kullanımda oluşturulur, import
 * anında değil: modül düzeyinde bir çağrı, bu dosyayı yalnızca import eden
 * ama hiç sorgu yapmayan sayfalar için build sırasında patlardı.
 *
 * Her zaman şablon etiketi olarak kullan, böylece değerler parametrelenir:
 *   const rows = await sql()`select * from accounts where email = ${email}`
 * Sorguyu asla dize birleştirmeyle kurma.
 */
export function sql(): NeonQueryFunction<false, false> {
  if (client) return client
  client = neon(readDatabaseUrl(process.env))
  return client
}

/** Test dikişi. Ezberlenmiş istemciyi temizler ki yeni ortam etkili olsun. */
export function resetDbClient(): void {
  client = null
}
```

- [ ] **Step 7: Testi çalıştır, geçtiğini gör**

```bash
npm test -w @sushi/identity-infra
```

Beklenen: 4 test PASS.

- [ ] **Step 8: Migration çalıştırıcısını yaz**

`packages/identity-infra/src/db/migrate.ts`:

```ts
/**
 * Migration'ları sırayla uygular ve uygulananları kaydeder.
 *
 * Kasıtlı olarak aptal: dosyaları isme göre sıralar, daha önce
 * uygulanmamış olanları çalıştırır, adını yazar. Geri alma (down) yok —
 * ileri doğru düzeltme, geri alma mekanizmasından daha güvenilirdir.
 *
 * Neon'un HTTP sürücüsü değil, klasik `pg` sürücüsü kullanılır: HTTP
 * sürücüsü tek çağrıda birden fazla SQL ifadesi çalıştırmaz ve migration
 * dosyaları tanım gereği çok ifadelidir. Ayrıca her dosya tek bir
 * transaction içinde koşar — yarıda kalan bir migration şemayı yarım
 * bırakmaz. Bu script yalnızca elle, terminalden çalışır; uygulamanın
 * çalışma zamanı yolunda yer almaz.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Client } from 'pg'
import { readDatabaseUrl } from './env'

const MIGRATIONS_DIR = join(import.meta.dirname, '../../../../db/migrations')

async function main(): Promise<void> {
  const client = new Client({ connectionString: readDatabaseUrl(process.env) })
  await client.connect()

  try {
    await client.query(`
      create table if not exists schema_migrations (
        name       text primary key,
        applied_at timestamptz not null default now()
      )
    `)

    const { rows } = await client.query<{ name: string }>(
      'select name from schema_migrations',
    )
    const applied = new Set(rows.map(row => row.name))

    const files = readdirSync(MIGRATIONS_DIR)
      .filter(name => name.endsWith('.sql'))
      .sort()

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`atlandı   ${file}`)
        continue
      }
      const contents = readFileSync(join(MIGRATIONS_DIR, file), 'utf8')
      await client.query('begin')
      try {
        await client.query(contents)
        await client.query(
          'insert into schema_migrations (name) values ($1)',
          [file],
        )
        await client.query('commit')
      } catch (error) {
        await client.query('rollback')
        throw new Error(`${file} uygulanamadı: ${String(error)}`)
      }
      console.log(`uygulandı ${file}`)
    }

    console.log('migration tamam')
  } finally {
    await client.end()
  }
}

await main()
```

- [ ] **Step 9: Kurulum dokümanını yaz**

`docs/database-setup.md`:

```markdown
# Veritabanı kurulumu

Sushi Accounts, Neon üzerinde Postgres kullanır (ücretsiz katman yeterli).

## 1. Veritabanını oluştur

1. https://neon.tech adresinde bir proje aç.
2. Connection string'i kopyala (`postgresql://...` ile başlar).

## 2. Yerel ortamı ayarla

Repo kökünde `.env.local` dosyası oluştur:

    DATABASE_URL=postgresql://kullanici:parola@host/veritabani?sslmode=require

Bu dosya `.gitignore` içindedir ve asla commit edilmez.

## 3. Migration'ları uygula

    npm run migrate -w @sushi/identity-infra

Komut idempotenttir: uygulanmış migration'ları atlar, yalnızca yenileri
çalıştırır. Çıktı, hangi dosyanın uygulandığını satır satır gösterir.

## 4. Doğrula

Neon konsolunda SQL Editor'ü aç ve şunu çalıştır:

    select scope_type, key from roles order by scope_type, key;

Beş satır dönmeli: org/admin, org/member, org/owner, product/owner,
product/player.
```

- [ ] **Step 10: .env.local'ı gitignore'a ekle**

Kök `.gitignore` dosyasına ekle:

```gitignore
.env.local
```

- [ ] **Step 11: Migration'ları gerçek veritabanına uygula**

Önce `docs/database-setup.md`'deki adımları izleyerek `.env.local` dosyasını oluştur, sonra:

```bash
npm run migrate -w @sushi/identity-infra
```

Beklenen çıktı:

```
uygulandı 0001_identity.sql
uygulandı 0002_seed_roles.sql
migration tamam
```

Komutu ikinci kez çalıştır; bu sefer her iki satır da `atlandı` demeli. Idempotentlik böyle doğrulanır.

- [ ] **Step 12: Başlangıç verisini doğrula**

Neon konsolunda çalıştır:

```sql
select r.scope_type, r.key, count(rp.permission_key) as izin_sayisi
from roles r
left join role_permissions rp on rp.role_id = r.id
group by r.scope_type, r.key
order by r.scope_type, r.key;
```

Beklenen: org/owner 5 izin, org/admin 3, org/member 1, product/owner 2, product/player 1.

- [ ] **Step 13: Commit**

```bash
git add db packages/identity-infra docs/database-setup.md .gitignore package-lock.json
git commit -m "feat: kimlik şeması, başlangıç rolleri ve migration altyapısı"
```

---

## Plan 1 Sonu — Neyin Bittiği

Bu plan bittiğinde elinde şunlar olur: çalışan bir monorepo, bağımsızlığı test tarafından zorlanan bir `identity-core` paketi, token ve parola politikası ilkelleri, ve gerçek bir veritabanında duran tam şema.

Henüz kimse kayıt olamaz — o Plan 2'nin işi.

## Sonraki Planlar

- **Plan 2 — Parola ile kimlik doğrulama:** Argon2id hasher, sızıntı kontrolü adaptörü, kayıt, e-posta doğrulama, giriş, oturum, çıkış, parola sıfırlama, hız sınırlama, `apps/accounts` Next.js iskeleti.
- **Plan 3 — Yetkilendirme:** `can()`, `GrantReader`, Postgres ve bellek implementasyonları.
- **Plan 4 — Google ile giriş:** OAuth 2.0 + PKCE, hesap bağlama kuralı, hesap ayarları ekranları.
- **Plan 5 — Kuruluşlar ve davetler:** kurma, davet, kabul, üye yönetimi, "en az bir owner" değişmezi.
- **Plan 6 — JWT ve JWKS:** imzalama anahtarı yönetimi, erişim token'ı uç noktası, `identity-client`.
