const UNKNOWN = 'bilinmeyen'

/**
 * İstemcinin IP adresini hız sınırlama için çıkarır.
 *
 * `x-forwarded-for` istemcinin kendisi tarafından eklenebilen bir liste;
 * ham hâliyle almak, başlığı her istekte değiştiren bir saldırgana yeni bir
 * sınırlama kovası kazandırır. `x-real-ip` Vercel tarafından ayarlanır ve
 * istemci proxy üzerinden bunu sahteleyemez, bu yüzden öncelik ondadır.
 * `x-forwarded-for` kullanılacaksa, güvenilir en yakın proxy'nin eklediği
 * SON giriş alınır — ilki değil, çünkü ilki istemcinin kendi eklediği olabilir.
 */
export function clientIp(headers: Headers): string {
  const real = headers.get('x-real-ip')
  if (real) return real.trim()

  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const parts = forwarded.split(',')
    const last = parts[parts.length - 1]
    if (last) return last.trim()
  }

  return UNKNOWN
}
