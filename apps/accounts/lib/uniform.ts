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
 *
 * Ölçüldü, tahmin edilmedi (2026-08-14): Kayıt yolunun gerçek maliyeti —
 * HIBP sızıntı kontrolü + Argon2id hash (19 MiB, 2 geçiş) + iki Neon HTTP
 * sürücüsü gidiş-dönüşü (createWithPassword + verifications.create) —
 * gerçek adaptörlerle ve gerçek Neon veritabanına karşı, repo kökündeki
 * `.env.local`'daki bağlantıyla ölçüldü (19 örnek, 4 ayrı süreç
 * çalıştırması). Isınmış (sıcak) bağlantıda tipik toplam ~115–130 ms;
 * her sürecin İLK isteğinde (Neon HTTP sürücüsü her bağlantıyı yeniden
 * kurduğu için) tutarlı biçimde ~290–370 ms, bir örnekte ~1000 ms'ye
 * kadar çıktı. Sunucusuz (serverless) bir fonksiyon çağrısı da genelde
 * "soğuk" başladığından, bu en kötü durumu tipik kabul ediyoruz. Eski
 * 400 ms değeri gözlemlenen soğuk-başlangıç maliyetinin çok altındaydı ve
 * timing side-channel'ı kapatmıyordu. 1500 ms, gözlemlenen en kötü örneğin
 * (~1000 ms) rahatça üzerinde bırakıyor.
 */
const DEFAULT_MINIMUM_MS = 1500

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
