// Uçtan uca akış testi: gerçek Chromium ile registration → verification →
// login → session guard → all-device logout → password reset akışlarının
// tamamını, gerçek dev sunucusuna ve gerçek Postgres'e karşı sürer.
//
// Neden bir e-posta sağlayıcısı yerine sunucu log dosyası: e-posta gönderimi
// henüz gerçek değil (ConsoleEmailSender), bağlantılar sunucu konsoluna
// yazılıyor. Bu script o logu okuyarak doğrulama/sıfırlama bağlantılarını
// kullanıcı gibi "tıklıyor".
//
// Önkoşullar ve çalıştırma şekli: bkz. docs/README.md ("Uçtan uca testler").
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { neon } from '@neondatabase/serverless'
import { chromium } from 'playwright'

const BASE = 'http://localhost:3001'
const LOG = process.env.E2E_LOG
const EMAIL = process.env.E2E_EMAIL
const PASSWORD = 'dogru-parola-12345'
const NEW_PASSWORD = 'yeni-parola-67890'
const SCREENSHOT = join(import.meta.dirname, '_flows-hesap.png')

if (!LOG) throw new Error('E2E_LOG tanımlı değil — dev sunucusunun log dosyasının yolu gerekli.')
if (!EMAIL) throw new Error('E2E_EMAIL tanımlı değil — testin kullanacağı e-posta adresi gerekli.')

const results = []
function check(name, passed, detail = '') {
  results.push({ name, passed, detail })
  console.log(`${passed ? 'GECTI' : 'KALDI'} | ${name}${detail ? ' | ' + detail : ''}`)
}

/** Next'in dev overlay'i tıklamaları yakaladığı için formu doğrudan gönderiyoruz. */
async function submit(page) {
  await page.evaluate(() => document.querySelector('form').requestSubmit())
}

async function fill(page, name, value) {
  await page.fill(`input[name="${name}"]`, value)
}

/**
 * Sayfanın kendi hata mesajını okur. Next'in dev hata katmanı da
 * role="alert" kullandığı için `p` etiketiyle daraltıyoruz.
 */
async function alertText(page, previous = null) {
  await page.waitForFunction(
    prev => {
      const text = document.querySelector('p[role="alert"]')?.textContent?.trim()
      return Boolean(text) && text !== prev
    },
    previous,
    { timeout: 25000 },
  )
  return (await page.textContent('p[role="alert"]')).trim()
}

/** Sunucu logundaki son e-posta gövdesinden verilen yolu taşıyan bağlantıyı çeker. */
function linkFromLog(path) {
  const log = readFileSync(LOG, 'utf8')
  const matches = [...log.matchAll(new RegExp(`${BASE}${path}\\?token=[A-Za-z0-9_-]+`, 'g'))]
  return matches.at(-1)?.[0] ?? null
}

/**
 * Bu koşunun kendi hız-sınırlama sayaçlarını temizler.
 *
 * Yalnızca bu script'in gerçekten kullandığı kovaları siliyoruz (uygulamanın
 * tüm `rate_limits` tablosunu değil) — böylece koşu, üzerinde çalıştığı
 * veritabanındaki başka kullanıcıların/testlerin sayaçlarına dokunmaz. Yine
 * de bu, gerçek bir üretim veritabanına karşı güvenle çalıştırılabileceği
 * anlamına gelmez: script, EMAIL adresinin sınırlarını sıfırlıyor ve bu
 * sunucu tarafında gözlemlenebilir bir yan etki.
 */
async function resetRateLimits() {
  if (!process.env.DATABASE_URL) return
  const sql = neon(process.env.DATABASE_URL)
  await sql`
    delete from rate_limits
    where bucket in ('register', 'login-ip', 'login-email', 'reset-ip', 'reset-email', 'reset-complete')
  `
  console.log('hiz sinirlama sayaclari sifirlandi (bu koşunun kovaları)')
}

async function main() {
  await resetRateLimits()

  const browser = await chromium.launch()
  const ctx = await browser.newContext()
  const page = await ctx.newPage()

  // ---------- KAYIT ----------
  // React 19 form action'dan sonra kontrolsüz alanları sıfırlıyor, bu yüzden
  // her gönderimden önce tüm alanları yeniden dolduruyoruz.
  async function registerAttempt(password, previousAlert = null) {
    await fill(page, 'displayName', 'E2E Test')
    await fill(page, 'email', EMAIL)
    await fill(page, 'password', password)
    await submit(page)
    return previousAlert === undefined ? null : alertText(page, previousAlert)
  }

  await page.goto(`${BASE}/kayit`)
  const shortMsg = await registerAttempt('kisa')
  check('kisa parola reddedildi', /karakter/.test(shortMsg), shortMsg)

  const breachMsg = await registerAttempt('password123456', shortMsg)
  check('sizmis parola reddedildi', /sızıntı/.test(breachMsg), breachMsg)

  await fill(page, 'displayName', 'E2E Test')
  await fill(page, 'email', EMAIL)
  await fill(page, 'password', PASSWORD)
  await submit(page)
  await page.waitForFunction(() => document.querySelector('h1')?.textContent?.includes('Neredeyse'), { timeout: 20000 })
  check('kayit basarili', true)

  // ---------- DOGRULAMA ----------
  await page.waitForTimeout(1000)
  const verifyLink = linkFromLog('/dogrula')
  check('dogrulama baglantisi e-postaya yazildi', Boolean(verifyLink), verifyLink ?? 'YOK')

  // Bot senaryosu: bağlantıyı sadece açmak token'ı harcamamalı (Outlook Safe
  // Links, Slack unfurling gibi önizleme botları GET'i kullanıcıdan önce yapar).
  await page.goto(verifyLink)
  const beforeConfirm = await page.textContent('body')
  check('salt GET token harcamiyor', !/doğrulandı/i.test(beforeConfirm))

  await submit(page)
  await page.waitForTimeout(1500)
  check('onay sonrasi dogrulandi', /doğrulandı/i.test(await page.textContent('body')))

  // Tek kullanımlık: aynı bağlantı ikinci kez çalışmamalı.
  await page.goto(verifyLink)
  await submit(page)
  await page.waitForTimeout(1500)
  check('token tek kullanimlik', /geçersiz/i.test(await page.textContent('body')))

  // ---------- GIRIS ----------
  await page.goto(`${BASE}/giris`)
  await fill(page, 'email', EMAIL)
  await fill(page, 'password', 'yanlis-parola-12345')
  await submit(page)
  const wrongPwMsg = await alertText(page)

  await page.goto(`${BASE}/giris`)
  await fill(page, 'email', `olmayan-${Date.now()}@example.com`)
  await fill(page, 'password', 'herhangi-parola-123')
  await submit(page)
  const unknownMsg = await alertText(page)

  // Yanlış parola ile bilinmeyen hesap aynı mesajı vermeli — aksi hâlde
  // saldırgan hangi adreslerin kayıtlı olduğunu mesaj farkından çıkarabilir.
  check('yanlis parola ve olmayan hesap ayni mesaji doner',
    wrongPwMsg === unknownMsg && wrongPwMsg.length > 0, wrongPwMsg)

  await page.goto(`${BASE}/giris`)
  await fill(page, 'email', EMAIL)
  await fill(page, 'password', PASSWORD)
  await submit(page)
  await page.waitForURL('**/hesap', { timeout: 20000 })
  check('dogru bilgilerle giris yapildi', true)
  check('hesap sayfasi e-postayi gosteriyor', (await page.textContent('body')).includes(EMAIL))

  // ---------- OTURUM KORUMASI ----------
  const anon = await browser.newContext()
  const anonPage = await anon.newPage()
  await anonPage.goto(`${BASE}/hesap`)
  check('oturumsuz /hesap girise yonlendiriyor', anonPage.url().includes('/giris'), anonPage.url())
  await anon.close()

  // ---------- TUM CIHAZLARDAN CIKIS ----------
  const second = await browser.newContext()
  const secondPage = await second.newPage()
  await secondPage.goto(`${BASE}/giris`)
  await fill(secondPage, 'email', EMAIL)
  await fill(secondPage, 'password', PASSWORD)
  await submit(secondPage)
  await secondPage.waitForURL('**/hesap', { timeout: 20000 })
  check('ikinci tarayicida da giris yapildi', true)

  // İlk tarayıcıdan tüm cihazlardan çık (hesap sayfasındaki son form budur).
  await page.goto(`${BASE}/hesap`)
  await page.evaluate(() => {
    const forms = [...document.querySelectorAll('form')]
    forms[forms.length - 1].requestSubmit()
  })
  await page.waitForURL('**/giris', { timeout: 20000 })

  await secondPage.goto(`${BASE}/hesap`)
  check('tum cihazlardan cikis ikinci oturumu dusurdu',
    secondPage.url().includes('/giris'), secondPage.url())
  await second.close()

  // ---------- PAROLA SIFIRLAMA ----------
  await page.goto(`${BASE}/sifirla-istek`)
  await fill(page, 'email', EMAIL)
  await submit(page)
  await page.waitForFunction(() => document.querySelector('h1')?.textContent?.includes('gönderdik'), { timeout: 20000 })
  await page.waitForTimeout(1000)
  const resetLink = linkFromLog('/sifirla')
  check('sifirlama baglantisi uretildi', Boolean(resetLink), resetLink ?? 'YOK')

  // Olmayan adres, hesap sayımını önlemek için aynı ekranı vermeli.
  await page.goto(`${BASE}/sifirla-istek`)
  await fill(page, 'email', `hic-yok-${Date.now()}@example.com`)
  await submit(page)
  await page.waitForFunction(() => document.querySelector('h1')?.textContent?.includes('gönderdik'), { timeout: 20000 })
  check('olmayan adres icin de ayni ekran', true)

  // Zayıf parola bağlantıyı yakmamalı — kullanıcı ilk denemede yazım
  // hatası yapıp bağlantıyı bir daha isteyemez duruma düşmemeli.
  await page.goto(resetLink)
  await fill(page, 'password', 'kisa')
  await submit(page)
  check('zayif parola reddedildi', /karakter/.test(await alertText(page)))

  // Form sıfırlandığı için sayfayı yeniden açıyoruz: gizli token alanı da
  // sıfırlanmış olabilir, bu adım bağlantının hâlâ geçerli olduğunu sınar.
  await page.goto(resetLink)
  await fill(page, 'password', NEW_PASSWORD)
  await submit(page)
  await page.waitForFunction(() => document.querySelector('h1')?.textContent?.includes('değişti'), { timeout: 20000 })
  check('zayif denemeden sonra baglanti hala gecerliydi', true)

  // Aynı bağlantı ikinci kez çalışmamalı.
  await page.goto(resetLink)
  await fill(page, 'password', 'baska-parola-12345')
  await submit(page)
  check('sifirlama baglantisi tek kullanimlik', /geçersiz|süresi/.test(await alertText(page)))

  // Eski parola artık çalışmamalı, yenisi çalışmalı.
  await page.goto(`${BASE}/giris`)
  await fill(page, 'email', EMAIL)
  await fill(page, 'password', PASSWORD)
  await submit(page)
  check('eski parola artik calismiyor', /hatalı/i.test(await alertText(page)))

  await page.goto(`${BASE}/giris`)
  await fill(page, 'email', EMAIL)
  await fill(page, 'password', NEW_PASSWORD)
  await submit(page)
  await page.waitForURL('**/hesap', { timeout: 20000 })
  check('yeni parola calisiyor', true)

  await page.screenshot({ path: SCREENSHOT })
  await browser.close()

  const failed = results.filter(r => !r.passed)
  console.log(`\n=== ${results.length - failed.length}/${results.length} gecti ===`)
  if (failed.length) console.log('KALANLAR:\n' + failed.map(f => ' - ' + f.name + ' | ' + f.detail).join('\n'))
  process.exit(failed.length ? 1 : 0)
}

await main()
