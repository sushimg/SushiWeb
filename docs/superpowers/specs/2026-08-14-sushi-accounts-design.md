# Sushi Systems Accounts — Tasarım

Tarih: 2026-08-14
Durum: onaylandı, uygulama planı bekliyor

## 1. Amaç

Sushi Systems'ın tüm ürünleri (oyun motoru, oyunlar, şirket panelleri) için tek
bir evrensel kullanıcı hesabı. Hesap kimseye ait bir domaini bilmez: sadece
"sen kimsin" sorusunu cevaplar ve "hangi kapsamda ne yapabilirsin" sorusuna
veri üzerinden karar verir.

Aynı kişi eş zamanlı olarak bir oyunda oyuncu, bir şirkette admin ve motorda
lisans sahibi olabilir. Yeni bir ürün veya yeni bir rol eklemek çekirdek koda
dokunmayı gerektirmez.

## 2. Kapsam sınırı

Bu servis **yalnızca** kimlik, yetki ve kapsam yönetimidir. Oyun kaydı, skor
tablosu, telemetri, satın alma gibi ürün servisleri buraya girmez. Onlar
ileride ayrı servisler olarak, bu servisin ürettiği token'ı tüketerek eklenir.

Ürün servisleri bu servisin veritabanına asla erişmez. Sözleşme, imzalı
token ve yayınlanan public key'dir (JWKS).

## 3. Alınan kararlar ve gerekçeleri

| Karar | Seçim | Gerekçe |
|---|---|---|
| Kimlik yığını | Kendi kodumuz | Satıcı bağımsızlığı, tam taşınabilirlik |
| Yetki modeli | Scoped RBAC | Yeni rol/ürün = veri satırı, deploy yok |
| Kuruluşlar | Kendi kendini yöneten | Üye yönetimi müşteriye devredilir |
| Repo | Tek repo (`sushiweb`), ayrı dağıtım | Bütünlük + dağıtım izolasyonu |
| Barındırma | Vercel + Neon (ücretsiz katman) | Bütçe sıfır; kod taşınabilir kalır |
| İlk sürüm istemcisi | Yalnızca tarayıcı paneli | Native istemci henüz yok |

Bütçe notu: Vercel Hobby ticari kullanıma izin vermez. Proje hobi
aşamasındayken sorun değil; gelir elde edilmeye başlandığı gün ya Pro'ya
geçilecek ya da kendi sunucuya taşınacak. Kod bu geçişi ucuz kılacak şekilde
yazılır.

## 4. Yerleşim

```
sushiweb/
├─ apps/
│  ├─ web/        bugünkü Vite sitesi
│  └─ accounts/   Next.js. Kimlik servisi + panel. Ayrı Vercel projesi.
├─ packages/
│  ├─ identity-core/    saf domain — bağımlılık listesi BOŞ
│  ├─ identity-infra/   adaptörler: Postgres, e-posta, Google OAuth
│  └─ identity-client/  ürünlerin token doğrulamak için kullanacağı kütüphane
└─ db/migrations/       elle yazılmış SQL, sürüm sürüm
```

Katı kural: `identity-core` ne Next.js'e, ne Postgres'e, ne `node:`'a bağımlı
olur. Web Crypto kullanır. Dış dünyaya ihtiyacı olan her şey port olarak
tanımlanır. Bu kural bir derleme testiyle zorlanır.

Bağımlılık oku hep dışa doğrudur: ürünler kimliği tanır, kimlik ürünleri
tanımaz.

## 5. Veri modeli

```sql
-- KİMLİK
accounts
  id              uuid pk
  email           citext unique not null
  email_verified  boolean not null default false
  display_name    text
  status          text not null default 'active'   -- active | suspended | deleted
  created_at      timestamptz not null default now()

identities
  id            uuid pk
  account_id    uuid not null references accounts(id) on delete cascade
  provider      text not null            -- 'password' | 'google'
  subject       text not null            -- google sub; password için account_id
  secret_hash   text                     -- yalnızca password: argon2id
  created_at    timestamptz not null default now()
  unique (provider, subject)

-- KAPSAMLAR
organizations (id uuid pk, slug citext unique, name text, created_at)
products      (id uuid pk, slug citext unique, name text, created_at)

-- YETKİ (veri olarak)
permissions      (key text pk, description text)
roles            (id uuid pk, scope_type text, key text, name text,
                  unique (scope_type, key))
role_permissions (role_id, permission_key, pk (role_id, permission_key))

grants
  id          uuid pk
  account_id  uuid not null references accounts(id) on delete cascade
  scope_type  text not null              -- 'org' | 'product'
  scope_id    uuid not null
  role_id     uuid not null references roles(id)
  granted_at  timestamptz not null default now()
  unique (account_id, scope_type, scope_id, role_id)
  check (scope_type in ('org','product'))

-- OTURUM VE TOKEN'LAR
sessions
  id uuid pk, account_id uuid, token_hash text unique,
  expires_at timestamptz, revoked_at timestamptz, user_agent text, created_at

email_verifications (account_id, token_hash, expires_at, consumed_at)
password_resets     (account_id, token_hash, expires_at, consumed_at)

invitations
  id uuid pk, org_id uuid, email citext, role_id uuid,
  token_hash text unique, invited_by uuid,
  expires_at timestamptz, accepted_at timestamptz
  unique (org_id, email) where accepted_at is null

rate_limits (bucket text, subject text, window_start timestamptz, count int,
             pk (bucket, subject, window_start))
```

Gerekçeler:

- **`scope_id` yabancı anahtar değil.** İki tabloya işaret ediyor. Karşılığında
  ileride yeni kapsam türü (`team`, `project`) eklemek şema değişikliği
  gerektirmez. Bütünlük `core` kuralları ve testlerle korunur — bilinçli takas.
- **Hiçbir token ham saklanmaz.** Yedek, log veya hata raporu sızarsa
  hash'lerle oturum açılamaz. Ham token yalnızca gönderim anında var olur.
- **`citext` e-posta.** `A@x.com` ile `a@x.com` iki hesap açamaz — klasik hesap
  ele geçirme yüzeyi.
- **Kısmi benzersizlik (`where accepted_at is null`).** Aynı adrese iki bekleyen
  davet engellenir; kişi ayrıldıktan sonra tekrar davet edilebilir. Yarış
  durumunda bile bozulamayacak tek yer veritabanıdır.

## 6. Kimlik doğrulama akışları

### Kayıt (e-posta + parola)
Adres normalize edilir. Parola politikası: en az 12 karakter ve sızmış parola
listesi kontrolü (k-anonymity — SHA-1 hash'inin yalnızca ilk 5 karakteri dışarı
gider). Argon2id ile hash'lenir. `accounts` + `identities` yazılır, doğrulama
e-postası gider.

Hesap zaten varsa **aynı cevap döner**; var olan adrese "birisi hesabınla kayıt
olmaya çalıştı" e-postası gider. Amacı account enumeration'ı engellemek.

### E-posta doğrulama
Tek kullanımlık token, 24 saat, hash'i saklanır, `consumed_at` ile işaretlenir.
Doğrulanmamış hesap giriş yapabilir ama **hiçbir grant taşıyamaz ve hiçbir
davet kabul edemez**. Doğrulama, kimliğin değil yetkinin önkoşuludur.

### Giriş
Argon2id doğrulaması. Hesap yoksa da sahte bir hash doğrulaması koşturulur —
yanıt süresi hesabın varlığını ele vermesin diye.

### Google ile giriş
OAuth 2.0 + PKCE. Dönen `sub` ile identity aranır. Yoksa:

> Google'ın verdiği e-posta zaten bir hesaba aitse **ve Google onu doğrulanmış
> işaretlediyse**, yeni identity o hesaba bağlanır. Doğrulanmamışsa bağlanmaz;
> kullanıcı önce parolayla girip hesabından bağlar.

Bu kontrol atlanırsa saldırgan kurbanın adresiyle sahte sağlayıcı hesabı açıp
doğrudan içeri girebilir.

### Parola sıfırlama
Token 1 saat, tek kullanımlık. İstek her zaman aynı cevabı döner. Sıfırlama
tamamlandığında **o hesabın tüm oturumları iptal edilir**.

### Oturum
| Katman | Ömür | Nerede | Amaç |
|---|---|---|---|
| Oturum token'ı | 30 gün, kullanımda uzar | HttpOnly + Secure + SameSite=Lax cookie | Panel kimliği |
| Erişim token'ı (JWT) | 10 dakika | Bellek | İleride ürünlerin offline doğrulaması |

İlk sürümde panel yalnızca cookie kullanır. JWT uç noktası ve
`/.well-known/jwks.json` baştan yazılır ama tüketilmez — sonradan token formatı
değiştirmek, ona bağlanmış her ürünü kırar.

İkiye bölmenin sebebi iptal edilebilirlik ile hız arasındaki gerilim: uzun
ömürlü olan veritabanında (iptal edilebilir), kısa ömürlü olan imzalı. 10
dakika, "iptal edildi ama hâlâ geçerli" penceresinin üst sınırıdır.

### Hız sınırlama
Giriş, kayıt, sıfırlama ve davet uçlarında; hem IP hem hesap bazında. Vercel'de
kalıcı bellek olmadığından sayaçlar Postgres'te (`rate_limits`).

## 7. Yetkilendirme

```ts
// packages/identity-core/authorization.ts
export type Scope = { type: 'org' | 'product'; id: string }

export interface GrantReader {
  permissionsFor(accountId: string, scope: Scope): Promise<ReadonlySet<string>>
}

export async function can(
  reader: GrantReader,
  accountId: string,
  permission: string,
  scope: Scope,
): Promise<boolean> {
  return (await reader.permissionsFor(accountId, scope)).has(permission)
}
```

Tüm sistem bu fonksiyondan geçer. Uygulama kodu **hiçbir yerde rol ismi
görmez**:

```ts
// doğru
if (!(await can(reader, me, 'org.member.invite', { type: 'org', id: orgId })))
  return forbidden()

// yasak
if (membership.role === 'admin') { ... }
```

`permissionsFor` rol değil izin kümesi döndürür; böylece yetki mantığı
çekirdekten uygulamaya sızamaz.

İki değişmez:
- Doğrulanmamış hesap hiçbir izin taşıyamaz. Kontrol `permissionsFor` içinde,
  çağıranın insafına bırakılmadan yapılır.
- Hata durumunda `can()` **`false`** döner. Fail closed; varsayılan her zaman
  "hayır".

Başlangıç verisi (migration ile):

| scope | rol | izinler |
|---|---|---|
| org | `owner` | tümü + `org.delete`, `org.role.assign` |
| org | `admin` | `org.member.invite`, `org.member.remove`, `org.read` |
| org | `member` | `org.read` |
| product | `owner` | ürünün tüm izinleri |
| product | `player` | `product.play` |

## 8. Kuruluşlar ve davetler

**Kurma.** Doğrulanmış herhangi bir kullanıcı kurabilir. Kurana otomatik
`org:owner` grant'i verilir. Kuruluş ve ilk grant tek transaction içindedir.

**Davet.** `org.member.invite` izniyle; e-posta + rol seçilir. Token üretilir,
hash'i saklanır, ham hâli e-postaya gider, 7 gün geçerli.

Kabul iki durumu ayırır:
- **Hesabı varsa:** giriş yapar, kabul eder. Kabul anında oturumdaki hesabın
  e-postası davetinkiyle karşılaştırılır; **eşleşmiyorsa reddedilir.** Linki ele
  geçiren biri kuruluşa giremez.
- **Hesabı yoksa:** kayda yönlendirilir. O adresle kayıt tamamlanınca adres
  davetle kanıtlanmış sayılır, ayrı doğrulama e-postası gitmez; davet kabul
  edilir.

**Çıkarma / rol değiştirme.** `org.member.remove` ve `org.role.assign`
izinlerine bağlı. Üstünde tek değişmez:

> Bir kuruluşun her zaman en az bir `owner`'ı olmalıdır.

Son sahibin çıkarılmasını, kendini çıkarmasını ve rolünü düşürmesini birlikte
engeller. `core`'da tek fonksiyon olarak yazılır; üç akış da ondan geçer.

E-posta güvenli bir kanal değildir (loglanır, yönlendirilir, arşivlenir). Bu
yüzden davet e-postaya kilitlenir: garanti "linki kimse görmesin" değil, "linki
gören bile giremesin".

## 9. İlk sürümün sınırı

**Yazılacaklar**
- `apps/accounts` (Next.js, ayrı Vercel projesi)
- Kayıt, e-posta doğrulama, giriş, çıkış, tüm cihazlardan çıkış, parola sıfırlama
- Google ile giriş (PKCE) ve hesap bağlama
- Kuruluş kurma, davet gönder/kabul/iptal, üye listesi, rol değiştirme, çıkarma
- Hesap ayarları: isim, parola değiştirme, bağlı giriş yöntemleri, aktif oturumlar
- `can()` + `GrantReader` (Postgres ve bellek implementasyonları)
- Migration'lar + başlangıç rol/izin verisi
- `/.well-known/jwks.json` ve JWT uç noktası (yazılır, tüketilmez)
- Postgres tabanlı hız sınırlama
- Ürün/rol tanımları için SQL script'i (panel değil)

**Bilerek ertelenenler**
device authorization grant, MFA/TOTP, audit log, ürün/rol yönetim paneli,
faturalandırma, hesap silme akışı, webhook'lar.

Hiçbiri şemayı değiştirmez; hepsi ekleme olarak gelir. Bu, tasarımın
genişlemeye açıklığının ölçüsüdür.

## 10. Test yaklaşımı

- `identity-core`: veritabanısız, saniyenin altında. Parola politikası, token
  imza/doğrulama, `can()`, "en az bir owner", davet e-posta eşleşmesi.
- `identity-infra`: gerçek Postgres'e karşı; yalnızca SQL doğruluğu.
- Akış testleri: kayıt → doğrula → kuruluş kur → davet et → kabul et, tarayıcıda.
- Mimari test: `identity-core`'un bağımlılık listesi boş kalmalı. Oraya Postgres
  import eden bir satır derlemede patlamalı.

## 11. Hata davranışı

Kullanıcıya giden mesajlar kasıtlı belirsiz ("giriş bilgileri hatalı"), loglar
kasıtlı ayrıntılı. Beklenmeyen hatada sistem kapatma yönünde başarısız olur.

## 12. Bilinen riskler

- Kendi kimlik yığınının bakım maliyeti zamanla artar (sızmış parola listeleri,
  oturum iptali, hesap kurtarma suistimali). Tasarıma baştan konuldu; yine de
  sürekli ilgi ister.
- Vercel Hobby lisansı ticari kullanımı engelliyor — gelir başladığında taşıma
  veya yükseltme gerekir.
- Neon ücretsiz katmanının bağlantı ve depolama sınırları büyümeyle birlikte
  yeniden değerlendirilmeli.
