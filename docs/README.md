# Sushi Systems — Web

Sushi Systems'ın web tarafı. npm workspaces monorepo'su:

```
apps/web/        Tanıtım sitesi — React 19, Vite, Tailwind. EN/NO/TR, açık/koyu tema.
packages/        Kimlik servisinin paketleri (aşağıda).
db/migrations/   Elle yazılmış SQL şema dosyaları.
docs/            Tasarım dokümanları, planlar, kurulum notları.
```

## Geliştirme

Komutlar repo kökünden çalışır; `-w` bayrağı hangi workspace'e gittiğini söyler.

```bash
npm install                      # tüm workspace'ler için bir kez
npm run dev                      # siteyi başlat (apps/web)
npm run build                    # tüm paketleri derle
npm test                         # tüm testleri çalıştır
npm run typecheck                # tip kontrolü
npm run lint                     # ESLint

npm test -w @sushi/identity-core  # tek bir paketin testleri
```

## Kimlik servisi

Sushi Systems hesapları için kendi yazdığımız kimlik ve yetki sistemi. Tüm
ürünler (oyun motoru, oyunlar, şirket panelleri) tek bir hesabı paylaşır.

| Paket | Sorumluluk |
|---|---|
| `@sushi/identity-core` | Saf domain: iş kuralları ve portlar. **Bağımlılığı yok** — ne Node, ne framework, ne veritabanı. Bir test bunu zorlar. |
| `@sushi/identity-infra` | Adaptörler: Postgres, Argon2id, sızmış parola kontrolü, e-posta. |

Tasarımın tamamı ve gerekçeleri:
`docs/superpowers/specs/2026-08-14-sushi-accounts-design.md`

Uygulama planları `docs/superpowers/plans/` altında, sırayla numaralandırılmış.

## Ortam değişkenleri

**Site** (`apps/web/.env`): `apps/web/.env.example` dosyasını kopyala ve
iletişim formu için gereken anahtarı doldur — `VITE_WEB3FORMS_KEY` ya da
`VITE_CONTACT_ENDPOINT`.

**Veritabanı** (repo kökünde `.env.local`): `DATABASE_URL`. Kurulum adımları
`docs/database-setup.md` dosyasında. Bu dosya asla commit edilmez.

## Dağıtım

Vercel. Site projesinin Root Directory ayarı `apps/web` olmalıdır — monorepo'da
her uygulama kendi klasöründen ayrı dağıtılır. Yönlendirme kuralları
`apps/web/vercel.json` içinde; SPA rotalarının doğrudan açılışta çözülmesi
oradan gelir.
