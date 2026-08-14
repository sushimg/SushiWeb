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
