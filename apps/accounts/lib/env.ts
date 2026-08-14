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
