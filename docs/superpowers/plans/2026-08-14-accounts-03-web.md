# Sushi Accounts — Plan 3: Web Katmanı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Plan 2'nin headless iş kurallarına çalışan bir web yüzü takmak: `apps/accounts` uygulaması, eksik Postgres adaptörleri, hız sınırlama, oturum cookie'si ve kayıt/doğrulama/giriş/çıkış/sıfırlama ekranları.

**Architecture:** `apps/accounts` bir Next.js 16 uygulamasıdır ve **yalnızca bir birleştirme katmanıdır** — iş kuralı içermez. Formlar Server Action çağırır, action bileşim kökünden (`composition root`) hazır bağımlılıkları alıp `identity-core`'un use-case'ini çağırır ve sonucu HTTP'ye çevirir. Karar veren kod hâlâ core'da.

**Tech Stack:** Next.js 16 (App Router, Server Actions), React 19, Tailwind CSS 4, `@neondatabase/serverless`, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-14-sushi-accounts-design.md`

**Önceki planlar:** `2026-08-14-accounts-01-temel.md`, `2026-08-14-accounts-02-kimlik-cekirdegi.md` (ikisi de tamamlandı ve `main`'e alındı)

## Global Constraints

- `packages/identity-core` değişmez: `dependencies` boş kalır, `node:` veya bare specifier import edilmez. Mimari test bunu zorlar. Bu planda core'a **yalnızca** yeni bir port eklenir (`RateLimiter`), başka hiçbir değişiklik yapılmaz.
- `apps/accounts` içinde iş kuralı yazılmaz. Bir `if` parola politikasına, oturum ömrüne veya yetkiye karar veriyorsa yanlış yerdedir.
- Argon2 native bir modüldür: kimlik doğrulama yapan her route ve action `export const runtime = 'nodejs'` taşır.
- Oturum cookie'si: ad `sushi_session`, `httpOnly`, `secure`, `sameSite: 'lax'`, `path: '/'`. Ham token yalnızca cookie'de yaşar; veritabanında hash'i durur.
- **Hesap sayımı yasağı HTTP katmanında da geçerlidir.** Kayıt, giriş ve sıfırlama uçları, hesabın var olup olmadığından bağımsız olarak aynı gövdeyi döner *ve* aynı asgari süreyi harcar.
- Next.js 16'da `cookies()` **asenkrondur** — `await cookies()`. Eğitim verinden hatırladığın senkron kullanım bu sürümde yanlıştır.
- Ekranlar sade tutulur: çalışan, erişilebilir, Tailwind ile temiz. Görsel tasarım geçişi bu planın kapsamı dışındadır.
- Test runner Vitest. `npm test` ve `npm run typecheck` her commit öncesi geçmelidir.
- Commit mesajları: Türkçe gövde, İngilizce conventional prefix.

---

### Task 1: apps/accounts iskeleti

**Files:**
- Create: `apps/accounts/package.json`
- Create: `apps/accounts/next.config.ts`
- Create: `apps/accounts/tsconfig.json`
- Create: `apps/accounts/postcss.config.mjs`
- Create: `apps/accounts/app/layout.tsx`
- Create: `apps/accounts/app/globals.css`
- Create: `apps/accounts/app/page.tsx`
- Create: `apps/accounts/app/api/health/route.ts`
- Create: `apps/accounts/.env.example`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: monorepo workspace yapısı
- Produces: `npm run dev -w @sushi/accounts` ile çalışan uygulama; `/api/health` uç noktası `{ ok: true }` döner

- [ ] **Step 1: Paketi oluştur**

`apps/accounts/package.json`:

```json
{
  "name": "@sushi/accounts",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@sushi/identity-core": "*",
    "@sushi/identity-infra": "*",
    "next": "^16.3.0",
    "react": "^19.2.6",
    "react-dom": "^19.2.6"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.3.0",
    "@types/node": "^24.12.3",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "postcss": "^8.5.26",
    "tailwindcss": "^4.3.0",
    "typescript": "~6.0.2"
  }
}
```

Port 3001 bilinçli: `apps/web` 5173'te (Vite), ikisi aynı anda çalışabilsin.

`apps/accounts/next.config.ts`:

```ts
import type { NextConfig } from 'next'

const config: NextConfig = {
  // Workspace paketleri TypeScript kaynağı olarak yayınlanıyor (derlenmiş
  // değil), bu yüzden Next'in onları kendi derleme hattından geçirmesi gerekir.
  transpilePackages: ['@sushi/identity-core', '@sushi/identity-infra'],
}

export default config
```

`apps/accounts/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es2023",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "skipLibCheck": true,
    "incremental": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "types": ["node"],
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`apps/accounts/postcss.config.mjs`:

```js
export default { plugins: { '@tailwindcss/postcss': {} } }
```

- [ ] **Step 2: Kökü ve stilleri kur**

`apps/accounts/app/globals.css`:

```css
@import "tailwindcss";
```

`apps/accounts/app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sushi Systems Hesabı',
  description: 'Tüm Sushi Systems ürünleri için tek hesap.',
  // Kimlik sayfaları arama motorlarında görünmemeli.
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
        <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
          {children}
        </main>
      </body>
    </html>
  )
}
```

`apps/accounts/app/page.tsx`:

```tsx
import Link from 'next/link'

export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Sushi Systems Hesabı</h1>
      <p className="text-neutral-400">
        Tek hesap, tüm ürünler.
      </p>
      <div className="flex gap-4">
        <Link href="/giris" className="underline">Giriş yap</Link>
        <Link href="/kayit" className="underline">Hesap oluştur</Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Sağlık ucunu yaz**

`apps/accounts/app/api/health/route.ts`:

```ts
/**
 * Dağıtımın ayakta olduğunu doğrulamak için. Veritabanına dokunmaz —
 * "uygulama çalışıyor mu" ile "veritabanı erişilebilir mi" ayrı sorulardır
 * ve bunları tek uca bağlamak, biri düştüğünde diğerini de arızalı gösterir.
 */
export const runtime = 'nodejs'

export function GET(): Response {
  return Response.json({ ok: true })
}
```

- [ ] **Step 4: .env.example ve .gitignore**

`apps/accounts/.env.example`:

```
# Veritabanı bağlantısı. Yerelde repo kökündeki .env.local'dan gelir;
# Vercel'de proje ortam değişkeni olarak tanımlanır.
DATABASE_URL=

# Uygulamanın kendi genel adresi. E-posta içindeki doğrulama ve sıfırlama
# bağlantıları bununla kurulur, istekten okunmaz — Host başlığına güvenmek,
# saldırganın kendi adresine giden bir sıfırlama linki ürettirmesine izin verir.
APP_URL=http://localhost:3001
```

Kök `.gitignore`'a ekle (yoksa):

```gitignore
apps/*/.next
```

- [ ] **Step 5: Kur ve çalıştığını doğrula**

```bash
npm install
npm run typecheck -w @sushi/accounts
npm run build -w @sushi/accounts
```

Beklenen: build başarılı. Sonra dev sunucusunu başlat ve sağlık ucunu sorgula:

```bash
npm run dev -w @sushi/accounts &
sleep 5
curl -s http://localhost:3001/api/health
```

Beklenen: `{"ok":true}`. Sonra sunucuyu kapat.

- [ ] **Step 6: Commit**

```bash
git add apps/accounts .gitignore package-lock.json
git commit -m "feat: apps/accounts Next.js iskeleti ve sağlık ucu"
```

---

### Task 2: Doğrulama token deposu adaptörleri

**Files:**
- Create: `packages/identity-infra/src/stores/in-memory-verification-store.ts`
- Create: `packages/identity-infra/src/stores/postgres-verification-store.ts`
- Test: `packages/identity-infra/src/stores/__tests__/verification-store-contract.ts`
- Test: `packages/identity-infra/src/stores/__tests__/in-memory-verification-store.test.ts`
- Test: `packages/identity-infra/src/stores/__tests__/postgres-verification-store.test.ts`

**Interfaces:**
- Consumes: `VerificationStore` portu (Plan 2), `sql()` (Plan 1)
- Produces:
  - `class InMemoryVerificationStore implements VerificationStore`
  - `class PostgresVerificationStore implements VerificationStore` — kurucusu `(table: 'email_verifications' | 'password_resets')`
  - `runVerificationStoreContract(name, makeStore)`

Tek bir sınıf iki tabloya hizmet eder: `email_verifications` ve `password_resets` aynı şekle sahiptir ve aynı kuralları taşır. Tablo adı kurucudan gelir ve **sabit bir birlikten seçilir** — asla çağıranın verdiği serbest metin olarak sorguya girmez.

- [ ] **Step 1: Sözleşme testini yaz**

`packages/identity-infra/src/stores/__tests__/verification-store-contract.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { VerificationStore } from '@sushi/identity-core'

const NOW = new Date('2026-01-01T12:00:00Z')
const LATER = new Date('2026-01-01T13:00:00Z')

/**
 * VerificationStore'un davranış sözleşmesi.
 *
 * makeStore her testte taze bir depo ve o depoya ait geçerli bir hesap id'si
 * döndürmelidir (Postgres'te yabancı anahtar gerçek bir hesap ister).
 */
export function runVerificationStoreContract(
  name: string,
  makeStore: () => Promise<{ store: VerificationStore; accountId: string }>,
): void {
  describe(`${name} — VerificationStore sözleşmesi`, () => {
    it('yarattığı token\'ı harcayınca hesap id\'sini döner', async () => {
      const { store, accountId } = await makeStore()
      await store.create(accountId, 'hash-1', LATER)
      expect(await store.consume('hash-1', NOW)).toBe(accountId)
    })

    it('bilinmeyen token için null döner', async () => {
      const { store } = await makeStore()
      expect(await store.consume('olmayan-hash', NOW)).toBeNull()
    })

    it('token tek kullanımlıktır', async () => {
      const { store, accountId } = await makeStore()
      await store.create(accountId, 'hash-1', LATER)
      expect(await store.consume('hash-1', NOW)).toBe(accountId)
      expect(await store.consume('hash-1', NOW)).toBeNull()
    })

    it('süresi dolmuş token harcanamaz', async () => {
      const { store, accountId } = await makeStore()
      // Son kullanma tarihi şimdiden önce.
      await store.create(accountId, 'hash-1', new Date('2026-01-01T11:00:00Z'))
      expect(await store.consume('hash-1', NOW)).toBeNull()
    })

    it('tam son kullanma anında harcanamaz', async () => {
      // Sınır bilinçli olarak katı: expires_at > now olmalı, >= değil.
      const { store, accountId } = await makeStore()
      await store.create(accountId, 'hash-1', NOW)
      expect(await store.consume('hash-1', NOW)).toBeNull()
    })

    it('aynı hesap için birden fazla token yaşayabilir', async () => {
      // Kullanıcı doğrulama e-postasını iki kez isteyebilir; ikisi de
      // geçerli olmalı, yoksa ilk linke tıklayan kullanıcı hata alır.
      const { store, accountId } = await makeStore()
      await store.create(accountId, 'hash-1', LATER)
      await store.create(accountId, 'hash-2', LATER)
      expect(await store.consume('hash-1', NOW)).toBe(accountId)
      expect(await store.consume('hash-2', NOW)).toBe(accountId)
    })

    it('eşzamanlı iki harcamadan yalnızca biri kazanır', async () => {
      // Atomiklik: aynı token'la gelen iki istek, iki kez doğrulama yapmamalı.
      const { store, accountId } = await makeStore()
      await store.create(accountId, 'hash-1', LATER)
      const results = await Promise.all([
        store.consume('hash-1', NOW),
        store.consume('hash-1', NOW),
      ])
      expect(results.filter(r => r === accountId)).toHaveLength(1)
      expect(results.filter(r => r === null)).toHaveLength(1)
    })
  })
}
```

- [ ] **Step 2: Testleri bağla ve başarısız olduklarını gör**

`packages/identity-infra/src/stores/__tests__/in-memory-verification-store.test.ts`:

```ts
import { InMemoryVerificationStore } from '../in-memory-verification-store'
import { runVerificationStoreContract } from './verification-store-contract'

runVerificationStoreContract('InMemoryVerificationStore', async () => ({
  store: new InMemoryVerificationStore(),
  accountId: 'hesap-1',
}))
```

```bash
npm test -w @sushi/identity-infra
```

Beklenen: FAIL — `Failed to resolve import "../in-memory-verification-store"`.

- [ ] **Step 3: Bellek implementasyonunu yaz**

`packages/identity-infra/src/stores/in-memory-verification-store.ts`:

```ts
import type { VerificationStore } from '@sushi/identity-core'

interface Row {
  accountId: string
  expiresAt: Date
  consumed: boolean
}

/**
 * Testler için. Postgres implementasyonuyla aynı sözleşmeyi geçer.
 *
 * JavaScript tek iş parçacığında koştuğu için buradaki "atomiklik" bedava
 * gelir: consume'un kontrol ile işaretleme arasında await yoktur, dolayısıyla
 * araya başka bir çağrı giremez. Postgres'te aynı garanti tek bir UPDATE
 * ifadesinden gelir.
 */
export class InMemoryVerificationStore implements VerificationStore {
  private readonly rows = new Map<string, Row>()

  async create(
    accountId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    this.rows.set(tokenHash, { accountId, expiresAt, consumed: false })
  }

  async consume(tokenHash: string, now: Date): Promise<string | null> {
    const row = this.rows.get(tokenHash)
    if (!row) return null
    if (row.consumed) return null
    if (row.expiresAt <= now) return null
    row.consumed = true
    return row.accountId
  }
}
```

- [ ] **Step 4: Testi çalıştır, geçtiğini gör**

```bash
npm test -w @sushi/identity-infra
```

Beklenen: 7 sözleşme testi PASS.

- [ ] **Step 5: Postgres testini yaz ve başarısız olduğunu gör**

`packages/identity-infra/src/stores/__tests__/postgres-verification-store.test.ts`:

```ts
import { afterAll, describe, it } from 'vitest'
import { sql } from '../../db/client'
import { PostgresAccountStore } from '../postgres-account-store'
import { PostgresVerificationStore } from '../postgres-verification-store'
import { runVerificationStoreContract } from './verification-store-contract'

const hasDatabase = Boolean(process.env.DATABASE_URL)

async function cleanup(): Promise<void> {
  await sql()`delete from accounts where email like '%@example.com'`
}

if (!hasDatabase) {
  describe.skip('PostgresVerificationStore (DATABASE_URL yok, atlandı)', () => {
    it('atlandı', () => {})
  })
} else {
  // İki tablo da aynı sözleşmeyi geçmelidir — ikisi de aynı kuralları taşıyor.
  for (const table of ['email_verifications', 'password_resets'] as const) {
    runVerificationStoreContract(`PostgresVerificationStore(${table})`, async () => {
      await cleanup()
      const accounts = new PostgresAccountStore()
      const account = await accounts.createWithPassword(
        { email: `dogrulama@example.com`, displayName: null },
        'hash',
      )
      if (!account) throw new Error('test hesabı yaratılamadı')
      return { store: new PostgresVerificationStore(table), accountId: account.id }
    })
  }

  afterAll(cleanup)
}
```

```bash
npm test -w @sushi/identity-infra
```

Beklenen: FAIL — `Failed to resolve import "../postgres-verification-store"`.

- [ ] **Step 6: Postgres implementasyonunu yaz**

`packages/identity-infra/src/stores/postgres-verification-store.ts`:

```ts
import type { VerificationStore } from '@sushi/identity-core'
import { sql } from '../db/client'

/** Aynı şekli paylaşan iki tablo. Birlik kasıtlı olarak kapalı. */
export type VerificationTable = 'email_verifications' | 'password_resets'

/**
 * Tek kullanımlık token deposu.
 *
 * Harcama tek bir UPDATE ile yapılır: koşullar (harcanmamış ve süresi
 * dolmamış) WHERE içinde, işaretleme SET içinde, sonuç RETURNING ile döner.
 * Bu, "önce oku sonra yaz" desenindeki yarışı tamamen ortadan kaldırır —
 * eşzamanlı iki istekten yalnızca biri satırı günceller, diğeri boş döner.
 * Aynı işi iki sorguyla yapmak, aynı doğrulama linkinin iki kez
 * kullanılabildiği bir pencere açardı.
 */
export class PostgresVerificationStore implements VerificationStore {
  private readonly table: VerificationTable

  constructor(table: VerificationTable) {
    this.table = table
  }

  async create(
    accountId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    // Tablo adı parametrelenemez, bu yüzden sorgular iki sabit dal olarak
    // yazılıyor. Çağıranın verdiği bir dize asla sorgu metnine girmez.
    if (this.table === 'email_verifications') {
      await sql()`
        insert into email_verifications (account_id, token_hash, expires_at)
        values (${accountId}, ${tokenHash}, ${expiresAt.toISOString()})
      `
      return
    }
    await sql()`
      insert into password_resets (account_id, token_hash, expires_at)
      values (${accountId}, ${tokenHash}, ${expiresAt.toISOString()})
    `
  }

  async consume(tokenHash: string, now: Date): Promise<string | null> {
    const timestamp = now.toISOString()
    const rows =
      this.table === 'email_verifications'
        ? ((await sql()`
            update email_verifications set consumed_at = ${timestamp}
            where token_hash = ${tokenHash}
              and consumed_at is null
              and expires_at > ${timestamp}
            returning account_id
          `) as Array<{ account_id: string }>)
        : ((await sql()`
            update password_resets set consumed_at = ${timestamp}
            where token_hash = ${tokenHash}
              and consumed_at is null
              and expires_at > ${timestamp}
            returning account_id
          `) as Array<{ account_id: string }>)

    return rows[0]?.account_id ?? null
  }
}
```

- [ ] **Step 7: Testi çalıştır, geçtiğini gör**

```bash
npm test -w @sushi/identity-infra
npm run typecheck
```

Beklenen: sözleşme testi üç kez koşar (bellek + iki tablo) — 21 test PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/identity-infra
git commit -m "feat: doğrulama token deposu adaptörleri ve atomik harcama"
```

---

### Task 3: Oturum deposu adaptörleri

**Files:**
- Create: `packages/identity-infra/src/stores/in-memory-session-store.ts`
- Create: `packages/identity-infra/src/stores/postgres-session-store.ts`
- Test: `packages/identity-infra/src/stores/__tests__/session-store-contract.ts`
- Test: `packages/identity-infra/src/stores/__tests__/in-memory-session-store.test.ts`
- Test: `packages/identity-infra/src/stores/__tests__/postgres-session-store.test.ts`

**Interfaces:**
- Consumes: `SessionStore` portu (Plan 2), `sql()`
- Produces: `InMemorySessionStore`, `PostgresSessionStore`, `runSessionStoreContract(name, makeStore)`

- [ ] **Step 1: Sözleşme testini yaz**

`packages/identity-infra/src/stores/__tests__/session-store-contract.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { SessionStore } from '@sushi/identity-core'

const NOW = new Date('2026-01-01T12:00:00Z')
const LATER = new Date('2026-01-02T12:00:00Z')
const MUCH_LATER = new Date('2026-01-10T12:00:00Z')

export function runSessionStoreContract(
  name: string,
  makeStore: () => Promise<{ store: SessionStore; accountId: string }>,
): void {
  describe(`${name} — SessionStore sözleşmesi`, () => {
    it('yarattığı oturumu bulur', async () => {
      const { store, accountId } = await makeStore()
      await store.create(accountId, 'hash-1', LATER, 'Firefox')
      expect(await store.findAccountId('hash-1', NOW)).toBe(accountId)
    })

    it('bilinmeyen oturum için null döner', async () => {
      const { store } = await makeStore()
      expect(await store.findAccountId('olmayan', NOW)).toBeNull()
    })

    it('süresi dolmuş oturum bulunmaz', async () => {
      const { store, accountId } = await makeStore()
      await store.create(accountId, 'hash-1', new Date('2026-01-01T11:00:00Z'), null)
      expect(await store.findAccountId('hash-1', NOW)).toBeNull()
    })

    it('iptal edilmiş oturum bulunmaz', async () => {
      const { store, accountId } = await makeStore()
      await store.create(accountId, 'hash-1', LATER, null)
      await store.revoke('hash-1')
      expect(await store.findAccountId('hash-1', NOW)).toBeNull()
    })

    it('hesabın tüm oturumlarını iptal eder', async () => {
      const { store, accountId } = await makeStore()
      await store.create(accountId, 'hash-1', LATER, null)
      await store.create(accountId, 'hash-2', LATER, null)
      await store.revokeAllForAccount(accountId)
      expect(await store.findAccountId('hash-1', NOW)).toBeNull()
      expect(await store.findAccountId('hash-2', NOW)).toBeNull()
    })

    it('touch oturumun ömrünü uzatır', async () => {
      const { store, accountId } = await makeStore()
      await store.create(accountId, 'hash-1', LATER, null)
      await store.touch('hash-1', MUCH_LATER)
      // Eski son kullanma tarihinden sonraki bir anda hâlâ geçerli olmalı.
      expect(await store.findAccountId('hash-1', new Date('2026-01-05T12:00:00Z')))
        .toBe(accountId)
    })

    it('touch iptal edilmiş oturumu diriltmez', async () => {
      const { store, accountId } = await makeStore()
      await store.create(accountId, 'hash-1', LATER, null)
      await store.revoke('hash-1')
      await store.touch('hash-1', MUCH_LATER)
      expect(await store.findAccountId('hash-1', NOW)).toBeNull()
    })

    it('bilinmeyen oturumu iptal etmek hata vermez', async () => {
      const { store } = await makeStore()
      await expect(store.revoke('olmayan')).resolves.toBeUndefined()
    })
  })
}
```

- [ ] **Step 2: Testleri bağla ve başarısız olduklarını gör**

`packages/identity-infra/src/stores/__tests__/in-memory-session-store.test.ts`:

```ts
import { InMemorySessionStore } from '../in-memory-session-store'
import { runSessionStoreContract } from './session-store-contract'

runSessionStoreContract('InMemorySessionStore', async () => ({
  store: new InMemorySessionStore(),
  accountId: 'hesap-1',
}))
```

```bash
npm test -w @sushi/identity-infra
```

Beklenen: FAIL — çözülemeyen import.

- [ ] **Step 3: Bellek implementasyonunu yaz**

`packages/identity-infra/src/stores/in-memory-session-store.ts`:

```ts
import type { SessionStore } from '@sushi/identity-core'

interface Row {
  accountId: string
  expiresAt: Date
  revoked: boolean
}

export class InMemorySessionStore implements SessionStore {
  private readonly rows = new Map<string, Row>()

  async create(
    accountId: string,
    tokenHash: string,
    expiresAt: Date,
    _userAgent: string | null,
  ): Promise<void> {
    this.rows.set(tokenHash, { accountId, expiresAt, revoked: false })
  }

  async findAccountId(tokenHash: string, now: Date): Promise<string | null> {
    const row = this.rows.get(tokenHash)
    if (!row || row.revoked || row.expiresAt <= now) return null
    return row.accountId
  }

  async revoke(tokenHash: string): Promise<void> {
    const row = this.rows.get(tokenHash)
    if (row) row.revoked = true
  }

  async revokeAllForAccount(accountId: string): Promise<void> {
    for (const row of this.rows.values()) {
      if (row.accountId === accountId) row.revoked = true
    }
  }

  /** İptal edilmiş oturum uzatılmaz — çıkış yapmış biri geri dönemez. */
  async touch(tokenHash: string, expiresAt: Date): Promise<void> {
    const row = this.rows.get(tokenHash)
    if (row && !row.revoked) row.expiresAt = expiresAt
  }
}
```

- [ ] **Step 4: Testi çalıştır, geçtiğini gör**

```bash
npm test -w @sushi/identity-infra
```

Beklenen: 8 sözleşme testi PASS.

- [ ] **Step 5: Postgres testini yaz ve başarısız olduğunu gör**

`packages/identity-infra/src/stores/__tests__/postgres-session-store.test.ts`:

```ts
import { afterAll, describe, it } from 'vitest'
import { sql } from '../../db/client'
import { PostgresAccountStore } from '../postgres-account-store'
import { PostgresSessionStore } from '../postgres-session-store'
import { runSessionStoreContract } from './session-store-contract'

const hasDatabase = Boolean(process.env.DATABASE_URL)

async function cleanup(): Promise<void> {
  await sql()`delete from accounts where email like '%@example.com'`
}

if (!hasDatabase) {
  describe.skip('PostgresSessionStore (DATABASE_URL yok, atlandı)', () => {
    it('atlandı', () => {})
  })
} else {
  runSessionStoreContract('PostgresSessionStore', async () => {
    await cleanup()
    const accounts = new PostgresAccountStore()
    const account = await accounts.createWithPassword(
      { email: 'oturum@example.com', displayName: null },
      'hash',
    )
    if (!account) throw new Error('test hesabı yaratılamadı')
    return { store: new PostgresSessionStore(), accountId: account.id }
  })

  afterAll(cleanup)
}
```

- [ ] **Step 6: Postgres implementasyonunu yaz**

`packages/identity-infra/src/stores/postgres-session-store.ts`:

```ts
import type { SessionStore } from '@sushi/identity-core'
import { sql } from '../db/client'

/**
 * Oturumlar veritabanında tutulur çünkü iptal edilebilir olmaları gerekir.
 * Her sorgu üç koşulu birlikte kontrol eder: token eşleşiyor mu, iptal
 * edilmemiş mi, süresi dolmamış mı. Üçünü tek WHERE'de tutmak, birini
 * unutma ihtimalini ortadan kaldırır.
 */
export class PostgresSessionStore implements SessionStore {
  async create(
    accountId: string,
    tokenHash: string,
    expiresAt: Date,
    userAgent: string | null,
  ): Promise<void> {
    await sql()`
      insert into sessions (account_id, token_hash, expires_at, user_agent)
      values (${accountId}, ${tokenHash}, ${expiresAt.toISOString()}, ${userAgent})
    `
  }

  async findAccountId(tokenHash: string, now: Date): Promise<string | null> {
    const rows = (await sql()`
      select account_id from sessions
      where token_hash = ${tokenHash}
        and revoked_at is null
        and expires_at > ${now.toISOString()}
    `) as Array<{ account_id: string }>
    return rows[0]?.account_id ?? null
  }

  async revoke(tokenHash: string): Promise<void> {
    await sql()`
      update sessions set revoked_at = now()
      where token_hash = ${tokenHash} and revoked_at is null
    `
  }

  async revokeAllForAccount(accountId: string): Promise<void> {
    await sql()`
      update sessions set revoked_at = now()
      where account_id = ${accountId} and revoked_at is null
    `
  }

  async touch(tokenHash: string, expiresAt: Date): Promise<void> {
    // revoked_at koşulu şart: iptal edilmiş bir oturumun ömrünü uzatmak,
    // çıkış yapmış kullanıcıyı geri içeri almak olurdu.
    await sql()`
      update sessions set expires_at = ${expiresAt.toISOString()}
      where token_hash = ${tokenHash} and revoked_at is null
    `
  }
}
```

- [ ] **Step 7: Testi çalıştır, geçtiğini gör**

```bash
npm test -w @sushi/identity-infra
npm run typecheck
```

Beklenen: sözleşme testi iki kez koşar (bellek + Postgres) — 16 test PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/identity-infra
git commit -m "feat: oturum deposu adaptörleri"
```

---

### Task 4: Hız sınırlama

**Files:**
- Create: `packages/identity-core/src/ports/rate-limiter.ts`
- Create: `packages/identity-infra/src/stores/in-memory-rate-limiter.ts`
- Create: `packages/identity-infra/src/stores/postgres-rate-limiter.ts`
- Test: `packages/identity-infra/src/stores/__tests__/rate-limiter-contract.ts`
- Test: `packages/identity-infra/src/stores/__tests__/in-memory-rate-limiter.test.ts`
- Test: `packages/identity-infra/src/stores/__tests__/postgres-rate-limiter.test.ts`
- Modify: `packages/identity-core/src/index.ts`

**Interfaces:**
- Consumes: `sql()`
- Produces:
  - `interface RateLimiter { hit(bucket: string, subject: string, limit: number, windowMs: number, now: Date): Promise<boolean> }`
  - `InMemoryRateLimiter`, `PostgresRateLimiter`

- [ ] **Step 1: Portu tanımla**

`packages/identity-core/src/ports/rate-limiter.ts`:

```ts
/**
 * Hız sınırlama portu.
 *
 * Sabit pencere (fixed window) modeli: zaman `windowMs` uzunluğunda dilimlere
 * bölünür, her dilimde sayaç sıfırdan başlar. Kayan pencereye göre daha kaba
 * — pencere sınırında kısa süreliğine iki katı isteğe izin verir — ama tek
 * bir satır ve tek bir sorgu ile çalışır. Bizim ölçeğimizde bu takas doğru;
 * amaç kaba kuvvet saldırısını yavaşlatmak, trafiği milimetrik ölçmek değil.
 */
export interface RateLimiter {
  /**
   * Bir isteği sayar. İzin verilirse true, sınır aşıldıysa false döner.
   *
   * @param bucket Sınırlanan işlem, örn. 'login' veya 'reset-request'
   * @param subject Kim sınırlanıyor — IP adresi ya da e-posta
   */
  hit(
    bucket: string,
    subject: string,
    limit: number,
    windowMs: number,
    now: Date,
  ): Promise<boolean>
}
```

`packages/identity-core/src/index.ts` sonuna ekle:

```ts
export type { RateLimiter } from './ports/rate-limiter'
```

- [ ] **Step 2: Sözleşme testini yaz**

`packages/identity-infra/src/stores/__tests__/rate-limiter-contract.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { RateLimiter } from '@sushi/identity-core'

const WINDOW = 60_000
const T0 = new Date('2026-01-01T12:00:00Z')
const T_SAME = new Date('2026-01-01T12:00:30Z')      // aynı pencere
const T_NEXT = new Date('2026-01-01T12:01:30Z')      // sonraki pencere

export function runRateLimiterContract(
  name: string,
  makeLimiter: () => Promise<RateLimiter>,
): void {
  describe(`${name} — RateLimiter sözleşmesi`, () => {
    it('sınırın altındaki isteklere izin verir', async () => {
      const limiter = await makeLimiter()
      expect(await limiter.hit('login', 'a', 3, WINDOW, T0)).toBe(true)
      expect(await limiter.hit('login', 'a', 3, WINDOW, T0)).toBe(true)
      expect(await limiter.hit('login', 'a', 3, WINDOW, T0)).toBe(true)
    })

    it('sınırı aşan isteği reddeder', async () => {
      const limiter = await makeLimiter()
      for (let i = 0; i < 3; i++) await limiter.hit('login', 'b', 3, WINDOW, T0)
      expect(await limiter.hit('login', 'b', 3, WINDOW, T0)).toBe(false)
    })

    it('aynı pencere içinde sayar', async () => {
      const limiter = await makeLimiter()
      for (let i = 0; i < 3; i++) await limiter.hit('login', 'c', 3, WINDOW, T0)
      expect(await limiter.hit('login', 'c', 3, WINDOW, T_SAME)).toBe(false)
    })

    it('yeni pencerede sayaç sıfırlanır', async () => {
      const limiter = await makeLimiter()
      for (let i = 0; i < 3; i++) await limiter.hit('login', 'd', 3, WINDOW, T0)
      expect(await limiter.hit('login', 'd', 3, WINDOW, T_NEXT)).toBe(true)
    })

    it('özneler birbirini etkilemez', async () => {
      const limiter = await makeLimiter()
      for (let i = 0; i < 3; i++) await limiter.hit('login', 'e', 3, WINDOW, T0)
      expect(await limiter.hit('login', 'f', 3, WINDOW, T0)).toBe(true)
    })

    it('kovalar birbirini etkilemez', async () => {
      // Giriş denemelerini tüketmek, parola sıfırlama hakkını yakmamalı.
      const limiter = await makeLimiter()
      for (let i = 0; i < 3; i++) await limiter.hit('login', 'g', 3, WINDOW, T0)
      expect(await limiter.hit('reset', 'g', 3, WINDOW, T0)).toBe(true)
    })
  })
}
```

- [ ] **Step 3: Testleri bağla ve başarısız olduklarını gör**

`packages/identity-infra/src/stores/__tests__/in-memory-rate-limiter.test.ts`:

```ts
import { InMemoryRateLimiter } from '../in-memory-rate-limiter'
import { runRateLimiterContract } from './rate-limiter-contract'

runRateLimiterContract('InMemoryRateLimiter', async () => new InMemoryRateLimiter())
```

```bash
npm test -w @sushi/identity-infra
```

Beklenen: FAIL — çözülemeyen import.

- [ ] **Step 4: Bellek implementasyonunu yaz**

`packages/identity-infra/src/stores/in-memory-rate-limiter.ts`:

```ts
import type { RateLimiter } from '@sushi/identity-core'

/** Pencerenin başlangıç anı — aynı pencereye düşen tüm istekler aynı anahtarı paylaşır. */
function windowStart(now: Date, windowMs: number): number {
  return Math.floor(now.getTime() / windowMs) * windowMs
}

export class InMemoryRateLimiter implements RateLimiter {
  private readonly counts = new Map<string, number>()

  async hit(
    bucket: string,
    subject: string,
    limit: number,
    windowMs: number,
    now: Date,
  ): Promise<boolean> {
    const key = `${bucket} ${subject} ${windowStart(now, windowMs)}`
    const next = (this.counts.get(key) ?? 0) + 1
    this.counts.set(key, next)
    return next <= limit
  }
}
```

Anahtar birleştirmesinde ` ` kullanılıyor: normal bir ayırıcı (`:`) seçilseydi, içinde iki nokta geçen bir e-posta adresi başka bir anahtarla çakışabilirdi.

- [ ] **Step 5: Testi çalıştır, geçtiğini gör**

```bash
npm test -w @sushi/identity-infra
```

Beklenen: 6 sözleşme testi PASS.

- [ ] **Step 6: Postgres testini yaz ve başarısız olduğunu gör**

`packages/identity-infra/src/stores/__tests__/postgres-rate-limiter.test.ts`:

```ts
import { afterAll, describe, it } from 'vitest'
import { sql } from '../../db/client'
import { PostgresRateLimiter } from '../postgres-rate-limiter'
import { runRateLimiterContract } from './rate-limiter-contract'

const hasDatabase = Boolean(process.env.DATABASE_URL)

/** Sözleşme testleri sabit özneler kullanıyor; her koşu temiz başlamalı. */
async function cleanup(): Promise<void> {
  await sql()`delete from rate_limits where bucket in ('login', 'reset')`
}

if (!hasDatabase) {
  describe.skip('PostgresRateLimiter (DATABASE_URL yok, atlandı)', () => {
    it('atlandı', () => {})
  })
} else {
  runRateLimiterContract('PostgresRateLimiter', async () => {
    await cleanup()
    return new PostgresRateLimiter()
  })

  afterAll(cleanup)
}
```

- [ ] **Step 7: Postgres implementasyonunu yaz**

`packages/identity-infra/src/stores/postgres-rate-limiter.ts`:

```ts
import type { RateLimiter } from '@sushi/identity-core'
import { sql } from '../db/client'

function windowStart(now: Date, windowMs: number): Date {
  return new Date(Math.floor(now.getTime() / windowMs) * windowMs)
}

/**
 * Postgres tabanlı sabit pencere sayacı.
 *
 * Vercel'de istekler arasında paylaşılan bellek yoktur, bu yüzden sayaç
 * veritabanında durur. Artırma tek bir upsert ile yapılır ve güncel değeri
 * RETURNING ile geri verir: "oku, artır, yaz" üçlüsü olsaydı eşzamanlı
 * istekler birbirinin artışını ezer ve sınır kâğıt üstünde kalırdı.
 */
export class PostgresRateLimiter implements RateLimiter {
  async hit(
    bucket: string,
    subject: string,
    limit: number,
    windowMs: number,
    now: Date,
  ): Promise<boolean> {
    const start = windowStart(now, windowMs).toISOString()
    const rows = (await sql()`
      insert into rate_limits (bucket, subject, window_start, count)
      values (${bucket}, ${subject}, ${start}, 1)
      on conflict (bucket, subject, window_start)
        do update set count = rate_limits.count + 1
      returning count
    `) as Array<{ count: number }>

    return (rows[0]?.count ?? Number.MAX_SAFE_INTEGER) <= limit
  }
}
```

Sayaç okunamazsa `MAX_SAFE_INTEGER` varsayılır, yani istek reddedilir. Hız sınırlayıcının arızası, sınırın kalkması değil, kapının kapanması yönünde olmalı — fail closed.

- [ ] **Step 8: Testi çalıştır, geçtiğini gör**

```bash
npm test -w @sushi/identity-infra
npm test -w @sushi/identity-core
npm run typecheck
```

Beklenen: hepsi PASS.

- [ ] **Step 9: Commit**

```bash
git add packages/identity-core packages/identity-infra
git commit -m "feat: hız sınırlama portu ve sabit pencere adaptörleri"
```

---

### Task 5: Bileşim kökü, oturum cookie'si ve tekdüze yanıt süresi

**Files:**
- Create: `apps/accounts/lib/deps.ts`
- Create: `apps/accounts/lib/session.ts`
- Create: `apps/accounts/lib/uniform.ts`
- Create: `apps/accounts/lib/env.ts`
- Test: `apps/accounts/lib/__tests__/uniform.test.ts`
- Create: `apps/accounts/vitest.config.ts`
- Modify: `apps/accounts/package.json` (test script, vitest devDependency)

**Interfaces:**
- Consumes: tüm adaptörler ve use-case'ler
- Produces:
  - `deps` — use-case'lerin ihtiyaç duyduğu tüm bağımlılıkları taşıyan tek nesne
  - `readSessionToken(): Promise<string | null>`, `setSessionCookie(token)`, `clearSessionCookie()`
  - `currentAccount(): Promise<Account | null>`
  - `uniform<T>(work: Promise<T>, minimumMs?: number): Promise<T>`
  - `appUrl(): string`

- [ ] **Step 1: Ortam okuyucusunu yaz**

`apps/accounts/lib/env.ts`:

```ts
/**
 * Uygulamanın kendi genel adresi. E-postadaki bağlantılar bununla kurulur.
 *
 * İsteğin Host başlığından okunmaz — o başlık saldırganın kontrolündedir ve
 * ona güvenmek, kurbanın parola sıfırlama linkinin saldırganın sunucusuna
 * gitmesine izin verir. Bu, "host header injection" olarak bilinen klasik
 * hesap ele geçirme yoludur.
 */
export function appUrl(): string {
  const url = process.env.APP_URL
  if (!url) throw new Error('APP_URL tanımlı değil. Bkz. apps/accounts/.env.example')
  return url.replace(/\/+$/, '')
}
```

- [ ] **Step 2: Tekdüze süre testini yaz**

`apps/accounts/lib/__tests__/uniform.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { uniform } from '../uniform'

describe('uniform', () => {
  it('hızlı işi asgari süreye kadar bekletir', async () => {
    const started = Date.now()
    await uniform(Promise.resolve('bitti'), 120)
    expect(Date.now() - started).toBeGreaterThanOrEqual(110)
  })

  it('işin sonucunu aynen döner', async () => {
    expect(await uniform(Promise.resolve(42), 10)).toBe(42)
  })

  it('yavaş işi daha fazla geciktirmez', async () => {
    const slow = new Promise(resolve => setTimeout(() => resolve('yavaş'), 100))
    const started = Date.now()
    await uniform(slow, 20)
    // Asgari süre çoktan geçtiği için ek bekleme olmamalı.
    expect(Date.now() - started).toBeLessThan(180)
  })

  it('hata durumunda da asgari süreyi bekler', async () => {
    // Aksi hâlde başarısızlık, süresinden tanınır hâle gelirdi.
    const started = Date.now()
    await expect(uniform(Promise.reject(new Error('patladı')), 120)).rejects.toThrow(
      'patladı',
    )
    expect(Date.now() - started).toBeGreaterThanOrEqual(110)
  })
})
```

- [ ] **Step 3: Vitest'i kur ve testin başarısız olduğunu gör**

`apps/accounts/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: { environment: 'node', include: ['lib/**/*.test.ts'] },
})
```

`apps/accounts/package.json`'a ekle: `"test": "vitest run"` script'i ve `"vitest": "^4.1.10"` devDependency'si.

```bash
npm install
npm test -w @sushi/accounts
```

Beklenen: FAIL — `Failed to resolve import "../uniform"`.

- [ ] **Step 4: Tekdüze süreyi yaz**

`apps/accounts/lib/uniform.ts`:

```ts
/**
 * Bir işi en az verilen süre kadar sürdürür.
 *
 * Neden gerekli: Plan 2'nin use-case'leri hesabın var olup olmadığını dönen
 * değerle ele vermiyor, ama harcadıkları iş miktarı yollara göre farklı —
 * mesela var olmayan bir adrese kayıt olurken token üretilmiyor ve
 * veritabanına yazılmıyor. Bu fark, dışarıdan ölçülebilir bir gecikme
 * farkına dönüşür ve adresin kayıtlı olup olmadığını sızdırır.
 *
 * Asgari bir süre dayatmak bu farkı yutar: iki yol da aynı süreyi harcamış
 * görünür. Süre, en yavaş yolun tipik süresinden rahatça uzun seçilmelidir.
 */
const DEFAULT_MINIMUM_MS = 400

export async function uniform<T>(
  work: Promise<T>,
  minimumMs: number = DEFAULT_MINIMUM_MS,
): Promise<T> {
  const delay = new Promise<void>(resolve => setTimeout(resolve, minimumMs))
  // allSettled: iş hata verse bile bekleme tamamlanır, böylece başarısızlık
  // da başarı kadar sürer.
  const [result] = await Promise.allSettled([work, delay])
  if (result?.status === 'rejected') throw result.reason
  return (result as PromiseFulfilledResult<T>).value
}
```

- [ ] **Step 5: Testi çalıştır, geçtiğini gör**

```bash
npm test -w @sushi/accounts
```

Beklenen: 4 test PASS.

- [ ] **Step 6: Bileşim kökünü yaz**

`apps/accounts/lib/deps.ts`:

```ts
import {
  Argon2Hasher,
  ConsoleEmailSender,
  HibpBreachChecker,
  PostgresAccountStore,
  PostgresRateLimiter,
  PostgresSessionStore,
  PostgresVerificationStore,
} from '@sushi/identity-infra'
import { appUrl } from './env'

/**
 * Bileşim kökü: somut implementasyonların seçildiği tek yer.
 *
 * Uygulamanın geri kalanı hiçbir adaptörü doğrudan import etmez; buradan
 * gelen nesneyi kullanır. Bir gün e-posta gerçekten gönderilmeye
 * başladığında değişecek tek satır burada olacak.
 */
const accounts = new PostgresAccountStore()
const sessions = new PostgresSessionStore()

export const deps = {
  accounts,
  sessions,
  hasher: new Argon2Hasher(),
  breaches: new HibpBreachChecker(),
  email: new ConsoleEmailSender(),
  verifications: new PostgresVerificationStore('email_verifications'),
  resets: new PostgresVerificationStore('password_resets'),
  limiter: new PostgresRateLimiter(),
  verificationUrl: (token: string) => `${appUrl()}/dogrula?token=${token}`,
  resetUrl: (token: string) => `${appUrl()}/sifirla?token=${token}`,
  now: () => new Date(),
}
```

Bu import'un çalışması için `packages/identity-infra/src/index.ts` oluştur ve tüm adaptörleri dışa aktar:

```ts
export { Argon2Hasher } from './crypto/argon2-hasher'
export { HibpBreachChecker } from './crypto/hibp-breach-checker'
export { ConsoleEmailSender } from './email/console-email-sender'
export { InMemoryAccountStore } from './stores/in-memory-account-store'
export { InMemoryRateLimiter } from './stores/in-memory-rate-limiter'
export { InMemorySessionStore } from './stores/in-memory-session-store'
export { InMemoryVerificationStore } from './stores/in-memory-verification-store'
export { PostgresAccountStore } from './stores/postgres-account-store'
export { PostgresRateLimiter } from './stores/postgres-rate-limiter'
export { PostgresSessionStore } from './stores/postgres-session-store'
export {
  PostgresVerificationStore,
  type VerificationTable,
} from './stores/postgres-verification-store'
export { sql, resetDbClient } from './db/client'
```

`packages/identity-infra/package.json`'a `"main": "./src/index.ts"` ve `"exports": { ".": "./src/index.ts" }` alanlarını geri ekle (Plan 1'de dosya yokken kaldırılmışlardı).

- [ ] **Step 7: Oturum yardımcılarını yaz**

`apps/accounts/lib/session.ts`:

```ts
import { cookies } from 'next/headers'
import { authenticate, type Account } from '@sushi/identity-core'
import { deps } from './deps'

const COOKIE = 'sushi_session'
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60

/**
 * Cookie ayarları güvenlik açısından anlamlı:
 * - httpOnly: JavaScript okuyamaz, yani bir XSS açığı oturumu çalamaz.
 * - secure: yalnızca HTTPS üzerinden gider.
 * - sameSite lax: başka sitelerden gelen POST isteklerinde gönderilmez,
 *   ki bu CSRF'nin büyük bölümünü kapatır; normal link tıklamalarında
 *   gönderilir, böylece e-postadaki bağlantılar çalışır.
 */
export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies()
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE)
}

export async function readSessionToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(COOKIE)?.value ?? null
}

/** Oturum açmış hesabı çözer. Oturum yoksa veya geçersizse null. */
export async function currentAccount(): Promise<Account | null> {
  const token = await readSessionToken()
  if (!token) return null
  return authenticate(token, deps)
}
```

- [ ] **Step 8: Tip kontrolü ve commit**

```bash
npm run typecheck
npm test -w @sushi/accounts
```

Beklenen: temiz.

```bash
git add apps/accounts packages/identity-infra package-lock.json
git commit -m "feat: bileşim kökü, oturum cookie'si ve tekdüze yanıt süresi"
```

---

### Task 6: Kayıt ve e-posta doğrulama ekranları

**Files:**
- Create: `apps/accounts/app/kayit/page.tsx`
- Create: `apps/accounts/app/kayit/actions.ts`
- Create: `apps/accounts/app/dogrula/page.tsx`
- Create: `apps/accounts/components/Field.tsx`
- Create: `apps/accounts/components/SubmitButton.tsx`

**Interfaces:**
- Consumes: `register`, `verifyEmail`, `deps`, `uniform`
- Produces: `/kayit` ve `/dogrula` rotaları

- [ ] **Step 1: Ortak form bileşenlerini yaz**

`apps/accounts/components/Field.tsx`:

```tsx
export function Field({
  label,
  name,
  type = 'text',
  required = true,
  autoComplete,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  autoComplete?: string
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm text-neutral-400">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2
                   outline-none focus:border-neutral-400"
      />
    </label>
  )
}
```

`apps/accounts/components/SubmitButton.tsx`:

```tsx
'use client'

import { useFormStatus } from 'react-dom'

/**
 * Gönderim sürerken butonu kilitler. Çift gönderimi engellemenin yanı sıra,
 * kullanıcıya isteğin sürdüğünü gösterir — tekdüze yanıt süresi yüzünden
 * her istek en az birkaç yüz milisaniye sürer ve sessiz bir form donmuş
 * gibi hissedilir.
 */
export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded bg-neutral-100 px-3 py-2 font-medium text-neutral-900
                 disabled:opacity-50"
    >
      {pending ? 'Gönderiliyor…' : children}
    </button>
  )
}
```

- [ ] **Step 2: Kayıt action'ını yaz**

`apps/accounts/app/kayit/actions.ts`:

```ts
'use server'

import { register } from '@sushi/identity-core'
import { headers } from 'next/headers'
import { deps } from '@/lib/deps'
import { uniform } from '@/lib/uniform'

export const runtime = 'nodejs'

export interface RegisterState {
  message: string | null
  done: boolean
}

const MESSAGES: Record<string, string> = {
  'invalid-email': 'Bu e-posta adresi geçerli görünmüyor.',
  'too-short': 'Parola en az 12 karakter olmalı.',
  'too-long': 'Parola çok uzun.',
  breached: 'Bu parola bilinen veri sızıntılarında geçiyor. Başka bir tane seç.',
  'rate-limited': 'Çok fazla deneme yapıldı. Biraz sonra tekrar dene.',
}

/**
 * Kayıt formunu iş kuralına bağlar. Karar vermez, çevirir: FormData'yı
 * girdiye, sonucu kullanıcı mesajına.
 *
 * Başarı mesajı, adresin kayıtlı olup olmadığından bağımsız olarak aynıdır —
 * use-case'in hesap sayımı yasağı burada da korunmalı, yoksa bütün özen
 * son adımda boşa gider.
 */
export async function registerAction(
  _previous: RegisterState,
  form: FormData,
): Promise<RegisterState> {
  const email = String(form.get('email') ?? '')
  const password = String(form.get('password') ?? '')
  const displayName = String(form.get('displayName') ?? '').trim() || null

  const ip = (await headers()).get('x-forwarded-for') ?? 'bilinmeyen'
  const allowed = await deps.limiter.hit('register', ip, 5, 60 * 60 * 1000, deps.now())
  if (!allowed) return { message: MESSAGES['rate-limited']!, done: false }

  const result = await uniform(register({ email, password, displayName }, deps))

  if (result.outcome === 'rejected') {
    return { message: MESSAGES[result.reason] ?? 'Kayıt tamamlanamadı.', done: false }
  }

  return {
    message:
      'Doğrulama bağlantısı gönderildi. Gelen kutunu kontrol et. ' +
      '(Geliştirme aşamasında bağlantı sunucu konsoluna yazılıyor.)',
    done: true,
  }
}
```

- [ ] **Step 3: Kayıt sayfasını yaz**

`apps/accounts/app/kayit/page.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { Field } from '@/components/Field'
import { SubmitButton } from '@/components/SubmitButton'
import { registerAction, type RegisterState } from './actions'

const INITIAL: RegisterState = { message: null, done: false }

export default function RegisterPage() {
  const [state, action] = useActionState(registerAction, INITIAL)

  if (state.done) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Neredeyse tamam</h1>
        <p className="text-neutral-400">{state.message}</p>
        <Link href="/giris" className="underline">Giriş sayfasına dön</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Hesap oluştur</h1>

      <form action={action} className="space-y-4">
        <Field label="Adın" name="displayName" required={false} autoComplete="name" />
        <Field label="E-posta" name="email" type="email" autoComplete="email" />
        <Field
          label="Parola"
          name="password"
          type="password"
          autoComplete="new-password"
        />
        <p className="text-xs text-neutral-500">
          En az 12 karakter. Bilinen sızıntılarda geçen parolalar kabul edilmez.
        </p>
        <SubmitButton>Hesap oluştur</SubmitButton>
      </form>

      {state.message && (
        <p role="alert" className="text-sm text-red-400">{state.message}</p>
      )}

      <p className="text-sm text-neutral-400">
        Zaten hesabın var mı? <Link href="/giris" className="underline">Giriş yap</Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 4: Doğrulama sayfasını yaz**

`apps/accounts/app/dogrula/page.tsx`:

```tsx
import Link from 'next/link'
import { verifyEmail } from '@sushi/identity-core'
import { deps } from '@/lib/deps'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Doğrulama bağlantısının indiği sayfa.
 *
 * Token'ı harcamak bir yan etkidir ve normalde sunucu bileşeninde yapılmaz.
 * Burada bilinçli bir istisna: kullanıcı bu sayfaya e-postadaki bağlantıya
 * tıklayarak, yani GET ile geliyor ve tıklamanın kendisi niyetin ifadesi.
 * Bir form göstermek, doğrulamayı iki adıma bölerdi ve hiçbir şey kazandırmazdı.
 */
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  const verified = token ? await verifyEmail(token, deps) : false

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">
        {verified ? 'Hesabın doğrulandı' : 'Bağlantı geçersiz'}
      </h1>
      <p className="text-neutral-400">
        {verified
          ? 'Artık tüm Sushi Systems ürünlerini kullanabilirsin.'
          : 'Bu bağlantının süresi dolmuş ya da daha önce kullanılmış olabilir. ' +
            'Giriş yapıp yeni bir doğrulama bağlantısı isteyebilirsin.'}
      </p>
      <Link href="/giris" className="underline">Giriş yap</Link>
    </div>
  )
}
```

- [ ] **Step 5: Elle uçtan uca dene**

```bash
npm run dev -w @sushi/accounts
```

Tarayıcıda `http://localhost:3001/kayit` adresine git ve şunları sırayla doğrula:

1. 12 karakterden kısa parola → "Parola en az 12 karakter olmalı." mesajı, hesap yaratılmıyor
2. `password123456` gibi bilinen bir parola → sızıntı mesajı (bu adım gerçek ağa çıkar)
3. Geçerli bilgiler → başarı ekranı, **sunucu konsoluna doğrulama e-postası yazılıyor**
4. Konsoldaki bağlantıyı tarayıcıya yapıştır → "Hesabın doğrulandı"
5. Aynı bağlantıyı ikinci kez aç → "Bağlantı geçersiz"
6. Aynı e-postayla tekrar kayıt ol → yine başarı ekranı, konsolda bu sefer "hesabın zaten var" e-postası

Gördüklerini rapora yaz. Bu adım otomatik test değil; akışın uçtan uca gerçekten çalıştığını doğrulamak için.

- [ ] **Step 6: Commit**

```bash
git add apps/accounts
git commit -m "feat: kayıt ve e-posta doğrulama ekranları"
```

---

### Task 7: Giriş ve çıkış

**Files:**
- Create: `apps/accounts/app/giris/page.tsx`
- Create: `apps/accounts/app/giris/actions.ts`
- Create: `apps/accounts/app/hesap/page.tsx`
- Create: `apps/accounts/app/hesap/actions.ts`

**Interfaces:**
- Consumes: `login`, `logout`, `currentAccount`, `deps`, `uniform`
- Produces: `/giris`, `/hesap` rotaları ve çıkış action'ı

- [ ] **Step 1: Giriş action'ını yaz**

`apps/accounts/app/giris/actions.ts`:

```ts
'use server'

import { login } from '@sushi/identity-core'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { deps } from '@/lib/deps'
import { setSessionCookie } from '@/lib/session'
import { uniform } from '@/lib/uniform'

export const runtime = 'nodejs'

export interface LoginState {
  message: string | null
}

/**
 * Başarısızlık mesajı tek ve geneldir. "Böyle bir hesap yok" ile "parola
 * yanlış" arasındaki fark, saldırgana hangi adreslerin kayıtlı olduğunu
 * söyler; ayrımı kullanıcıya sunmanın getirisi bu bedeli karşılamaz.
 */
const FAILED = 'Giriş bilgileri hatalı.'

export async function loginAction(
  _previous: LoginState,
  form: FormData,
): Promise<LoginState> {
  const email = String(form.get('email') ?? '')
  const password = String(form.get('password') ?? '')

  const headerList = await headers()
  const ip = headerList.get('x-forwarded-for') ?? 'bilinmeyen'
  const userAgent = headerList.get('user-agent')

  // İki ayrı sınır: IP başına saldırının hızını, e-posta başına tek bir
  // hesaba yoğunlaşan denemeleri kısar. Yalnızca IP sınırlansaydı, dağıtık
  // bir saldırı tek hesabı serbestçe deneyebilirdi.
  const now = deps.now()
  const byIp = await deps.limiter.hit('login-ip', ip, 20, 15 * 60 * 1000, now)
  const byEmail = await deps.limiter.hit('login-email', email.toLowerCase(), 10, 15 * 60 * 1000, now)
  if (!byIp || !byEmail) {
    return { message: 'Çok fazla deneme yapıldı. Biraz sonra tekrar dene.' }
  }

  const result = await uniform(login({ email, password, userAgent }, deps))
  if (!result) return { message: FAILED }

  await setSessionCookie(result.token)
  redirect('/hesap')
}
```

`redirect()` bir istisna fırlatarak çalışır, bu yüzden ondan sonra `return` yazmaya gerek yoktur — ve `try/catch` içine alınmamalıdır, yoksa yönlendirme yutulur.

- [ ] **Step 2: Giriş sayfasını yaz**

`apps/accounts/app/giris/page.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { Field } from '@/components/Field'
import { SubmitButton } from '@/components/SubmitButton'
import { loginAction, type LoginState } from './actions'

const INITIAL: LoginState = { message: null }

export default function LoginPage() {
  const [state, action] = useActionState(loginAction, INITIAL)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Giriş yap</h1>

      <form action={action} className="space-y-4">
        <Field label="E-posta" name="email" type="email" autoComplete="email" />
        <Field
          label="Parola"
          name="password"
          type="password"
          autoComplete="current-password"
        />
        <SubmitButton>Giriş yap</SubmitButton>
      </form>

      {state.message && (
        <p role="alert" className="text-sm text-red-400">{state.message}</p>
      )}

      <div className="flex justify-between text-sm text-neutral-400">
        <Link href="/kayit" className="underline">Hesap oluştur</Link>
        <Link href="/sifirla-istek" className="underline">Parolamı unuttum</Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Hesap sayfasını ve çıkış action'larını yaz**

`apps/accounts/app/hesap/actions.ts`:

```ts
'use server'

import { logout } from '@sushi/identity-core'
import { redirect } from 'next/navigation'
import { deps } from '@/lib/deps'
import { clearSessionCookie, currentAccount, readSessionToken } from '@/lib/session'

export const runtime = 'nodejs'

export async function logoutAction(): Promise<void> {
  const token = await readSessionToken()
  if (token) await logout(token, deps)
  await clearSessionCookie()
  redirect('/giris')
}

/**
 * Tüm cihazlardan çıkış. Cookie'yi silmek yetmez — asıl iş oturumların
 * veritabanındaki kayıtlarını iptal etmek, çünkü çalınmış bir token'ı
 * tarayıcıdan silmek onu geçersiz kılmaz.
 */
export async function logoutEverywhereAction(): Promise<void> {
  const account = await currentAccount()
  if (account) await deps.sessions.revokeAllForAccount(account.id)
  await clearSessionCookie()
  redirect('/giris')
}
```

`apps/accounts/app/hesap/page.tsx`:

```tsx
import { redirect } from 'next/navigation'
import { currentAccount } from '@/lib/session'
import { logoutAction, logoutEverywhereAction } from './actions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const account = await currentAccount()
  if (!account) redirect('/giris')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Hesabın</h1>

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-neutral-400">E-posta</dt>
          <dd>{account.email}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-neutral-400">Ad</dt>
          <dd>{account.displayName ?? '—'}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-neutral-400">Doğrulama</dt>
          <dd>{account.emailVerified ? 'Doğrulandı' : 'Bekliyor'}</dd>
        </div>
      </dl>

      {!account.emailVerified && (
        <p className="rounded border border-amber-800 bg-amber-950 p-3 text-sm text-amber-200">
          E-posta adresin henüz doğrulanmadı. Doğrulanana kadar hiçbir ürüne
          erişim yetkisi alamazsın.
        </p>
      )}

      <div className="flex gap-4">
        <form action={logoutAction}>
          <button type="submit" className="underline">Çıkış yap</button>
        </form>
        <form action={logoutEverywhereAction}>
          <button type="submit" className="underline text-neutral-400">
            Tüm cihazlardan çık
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Elle uçtan uca dene**

```bash
npm run dev -w @sushi/accounts
```

Sırayla doğrula:

1. Kayıtlı bir hesapla `/giris` → `/hesap`'a yönleniyor, e-posta doğru görünüyor
2. Yanlış parola → "Giriş bilgileri hatalı."
3. Hiç var olmayan bir e-posta → **aynı mesaj** ve gözle ayırt edilebilir bir süre farkı yok
4. `/hesap` adresine oturum açmadan git → `/giris`'e yönleniyor
5. "Çıkış yap" → `/giris`, sonra `/hesap` yine yönlendiriyor
6. İki farklı tarayıcıda giriş yap, birinde "Tüm cihazlardan çık" → diğer tarayıcıda sayfayı yenile, oturumun düştüğünü gör

Son maddeyi atlama: veritabanı destekli oturumun tek gerçek gerekçesi o.

- [ ] **Step 5: Commit**

```bash
git add apps/accounts
git commit -m "feat: giriş, çıkış ve hesap sayfası"
```

---

### Task 8: Parola sıfırlama

**Files:**
- Create: `apps/accounts/app/sifirla-istek/page.tsx`
- Create: `apps/accounts/app/sifirla-istek/actions.ts`
- Create: `apps/accounts/app/sifirla/page.tsx`
- Create: `apps/accounts/app/sifirla/ResetForm.tsx`
- Create: `apps/accounts/app/sifirla/actions.ts`

**Interfaces:**
- Consumes: `requestPasswordReset`, `completePasswordReset`, `deps`, `uniform`
- Produces: `/sifirla-istek` ve `/sifirla` rotaları

- [ ] **Step 1: İstek action'ını ve sayfasını yaz**

`apps/accounts/app/sifirla-istek/actions.ts`:

```ts
'use server'

import { requestPasswordReset } from '@sushi/identity-core'
import { headers } from 'next/headers'
import { deps } from '@/lib/deps'
import { uniform } from '@/lib/uniform'

export const runtime = 'nodejs'

export interface RequestState {
  message: string | null
  done: boolean
}

/**
 * Cevap her zaman aynı: "adres kayıtlıysa bağlantı gönderildi."
 *
 * Hız sınırı aşıldığında bile aynı ekranı gösteriyoruz. Farklı bir mesaj
 * vermek, saldırgana hangi adreslerin sınırı tetiklediğini — dolayısıyla
 * hangilerinin ilgi çektiğini — söylerdi.
 */
const SAME_ANSWER =
  'Bu adres kayıtlıysa sıfırlama bağlantısı gönderildi. ' +
  '(Geliştirme aşamasında bağlantı sunucu konsoluna yazılıyor.)'

export async function requestResetAction(
  _previous: RequestState,
  form: FormData,
): Promise<RequestState> {
  const email = String(form.get('email') ?? '')

  const ip = (await headers()).get('x-forwarded-for') ?? 'bilinmeyen'
  const now = deps.now()
  const byIp = await deps.limiter.hit('reset-ip', ip, 10, 60 * 60 * 1000, now)
  const byEmail = await deps.limiter.hit('reset-email', email.toLowerCase(), 3, 60 * 60 * 1000, now)

  if (byIp && byEmail) {
    await uniform(requestPasswordReset(email, deps))
  } else {
    // Sınır aşıldı: iş yapılmıyor ama süre yine harcanıyor, yoksa
    // reddedilen istek hızından tanınırdı.
    await uniform(Promise.resolve())
  }

  return { message: SAME_ANSWER, done: true }
}
```

`apps/accounts/app/sifirla-istek/page.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { Field } from '@/components/Field'
import { SubmitButton } from '@/components/SubmitButton'
import { requestResetAction, type RequestState } from './actions'

const INITIAL: RequestState = { message: null, done: false }

export default function RequestResetPage() {
  const [state, action] = useActionState(requestResetAction, INITIAL)

  if (state.done) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Bağlantıyı gönderdik</h1>
        <p className="text-neutral-400">{state.message}</p>
        <Link href="/giris" className="underline">Giriş sayfasına dön</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Parolamı unuttum</h1>
      <p className="text-neutral-400">
        E-posta adresini yaz, sıfırlama bağlantısı gönderelim.
      </p>

      <form action={action} className="space-y-4">
        <Field label="E-posta" name="email" type="email" autoComplete="email" />
        <SubmitButton>Bağlantı gönder</SubmitButton>
      </form>

      <Link href="/giris" className="text-sm underline text-neutral-400">
        Giriş sayfasına dön
      </Link>
    </div>
  )
}
```

- [ ] **Step 2: Tamamlama action'ını yaz**

`apps/accounts/app/sifirla/actions.ts`:

```ts
'use server'

import { completePasswordReset } from '@sushi/identity-core'
import { deps } from '@/lib/deps'
import { uniform } from '@/lib/uniform'

export const runtime = 'nodejs'

export interface CompleteState {
  message: string | null
  done: boolean
}

const MESSAGES: Record<string, string> = {
  'invalid-token': 'Bu bağlantı geçersiz ya da süresi dolmuş. Yeniden iste.',
  'too-short': 'Parola en az 12 karakter olmalı.',
  'too-long': 'Parola çok uzun.',
  breached: 'Bu parola bilinen veri sızıntılarında geçiyor. Başka bir tane seç.',
}

export async function completeResetAction(
  _previous: CompleteState,
  form: FormData,
): Promise<CompleteState> {
  const token = String(form.get('token') ?? '')
  const password = String(form.get('password') ?? '')

  const result = await uniform(completePasswordReset(token, password, deps))

  if (result === 'ok') {
    return {
      message: 'Parolan değiştirildi ve tüm oturumların kapatıldı. Şimdi giriş yapabilirsin.',
      done: true,
    }
  }

  return { message: MESSAGES[result] ?? 'Parola değiştirilemedi.', done: false }
}
```

- [ ] **Step 3: Tamamlama sayfasını yaz**

`apps/accounts/app/sifirla/page.tsx`:

```tsx
import Link from 'next/link'
import { ResetForm } from './ResetForm'

export const dynamic = 'force-dynamic'

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Bağlantı eksik</h1>
        <p className="text-neutral-400">
          Bu sayfaya e-postandaki bağlantıyla gelmen gerekiyor.
        </p>
        <Link href="/sifirla-istek" className="underline">Yeni bağlantı iste</Link>
      </div>
    )
  }

  return <ResetForm token={token} />
}
```

`apps/accounts/app/sifirla/ResetForm.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { Field } from '@/components/Field'
import { SubmitButton } from '@/components/SubmitButton'
import { completeResetAction, type CompleteState } from './actions'

const INITIAL: CompleteState = { message: null, done: false }

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState(completeResetAction, INITIAL)

  if (state.done) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Parolan değişti</h1>
        <p className="text-neutral-400">{state.message}</p>
        <Link href="/giris" className="underline">Giriş yap</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Yeni parola belirle</h1>

      <form action={action} className="space-y-4">
        {/* Token gizli alanda taşınıyor: sayfa URL'sinde zaten var, ama
            formun kendi verisiyle gelmesi action'ı URL'den bağımsız kılar. */}
        <input type="hidden" name="token" value={token} />
        <Field
          label="Yeni parola"
          name="password"
          type="password"
          autoComplete="new-password"
        />
        <p className="text-xs text-neutral-500">
          En az 12 karakter. Bilinen sızıntılarda geçen parolalar kabul edilmez.
        </p>
        <SubmitButton>Parolayı değiştir</SubmitButton>
      </form>

      {state.message && (
        <p role="alert" className="text-sm text-red-400">{state.message}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Elle uçtan uca dene**

```bash
npm run dev -w @sushi/accounts
```

Sırayla doğrula:

1. `/sifirla-istek`'e kayıtlı bir adres → onay ekranı, konsolda sıfırlama bağlantısı
2. Kayıtlı olmayan bir adres → **aynı onay ekranı**, konsolda hiçbir şey yok
3. Konsoldaki bağlantı → yeni parola formu
4. Kısa bir parola gir → hata mesajı, ve **aynı bağlantı hâlâ çalışıyor** (yeniden dene)
5. Geçerli parola → başarı, sonra eski parolayla giriş denemesi başarısız, yenisiyle başarılı
6. Aynı sıfırlama bağlantısını ikinci kez aç ve kullan → "Bu bağlantı geçersiz"
7. Sıfırlamadan önce başka bir tarayıcıda açık olan oturum → sıfırlamadan sonra düşmüş olmalı

4. ve 7. maddeler bu akışın en kolay bozulan iki özelliği; ikisini de gözle gör.

- [ ] **Step 5: Tüm testleri ve build'i çalıştır**

```bash
npm test
npm run typecheck
npm run build -w @sushi/accounts
```

Beklenen: hepsi temiz.

- [ ] **Step 6: Commit**

```bash
git add apps/accounts
git commit -m "feat: parola sıfırlama akışı"
```

---

## Plan 3 Sonu — Neyin Bittiği

Tarayıcıdan hesap açılabiliyor, e-posta doğrulanabiliyor, giriş yapılabiliyor, çıkılabiliyor, tüm cihazlardan çıkılabiliyor ve parola sıfırlanabiliyor. Hız sınırlama dört ucun da önünde. E-posta hâlâ konsola yazılıyor — port arkasında, değiştirmesi tek dosya.

Yetkilendirme henüz yok: hesaplar var ama hiçbiri bir ürüne veya kuruluşa bağlı değil. O Plan 4.

## Dağıtım Notu

`apps/accounts` ayrı bir Vercel projesi olarak kurulmalıdır: aynı repo, Root Directory `apps/accounts`. Ortam değişkenleri `DATABASE_URL` ve `APP_URL`. Bu, kullanıcının panelden yapacağı bir iştir ve plan bittiğinde hatırlatılmalıdır.

## Sonraki Planlar

- **Plan 4 — Yetkilendirme:** `can()`, `GrantReader`, Postgres ve bellek implementasyonları, ürün/rol yönetimi için SQL script'leri.
- **Plan 5 — Google ile giriş:** OAuth 2.0 + PKCE, hesap bağlama kuralı, bağlı giriş yöntemleri ekranı. `setPasswordHash`'in yalnızca-OAuth hesaplarda sessiz no-op olması bu planda kapatılmalı (Plan 2'den devreden bulgu).
- **Plan 6 — Kuruluşlar ve davetler.**
- **Plan 7 — JWT, JWKS ve `identity-client`.**
- **Plan 8 — Gerçek e-posta gönderimi (Resend) ve görsel tasarım geçişi.**
