/**
 * Dağıtımın ayakta olduğunu doğrulamak için. Veritabanına dokunmaz —
 * "uygulama çalışıyor mu" ile "veritabanı erişilebilir mi" ayrı sorulardır
 * ve bunları tek uca bağlamak, biri düştüğünde diğerini de arızalı gösterir.
 */
export const runtime = 'nodejs'

export function GET(): Response {
  return Response.json({ ok: true })
}
