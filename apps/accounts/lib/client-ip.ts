/**
 * Bilinmeyen istemci IP'sini işaretlemek için kullanılan değer.
 *
 * `x-real-ip` ve `x-forwarded-for` başlıklarının ikisi de yoksa (örn. bu
 * başlıkları düşüren bir proxy'nin arkasında), hız sınırlayıcıya IP olarak
 * BU değeri değil, `null` veriyoruz — çağıran taraf bunu "IP kovasını
 * atla" olarak okumalı. Sabit bir dize dönseydik, o başlıklar olmadan gelen
 * her istek AYNI kovayı paylaşırdı: saatte 5 kayıt sınırı, o proxy'nin
 * arkasındaki HERKES için tek seferde tükenirdi (bir saldırgan, kurbanların
 * hepsini aynı anda kilitleyebilirdi). Bilinmeyen IP'de IP boyutunu atlamak
 * bu payı sıfıra indirir; buna karşılık e-posta bazlı sınırlar (`register`,
 * `login-email`, `reset-email`) hâlâ geçerli kaldığından tek bir hedefe karşı
 * saldırı yine sınırlanır. Bilinen ortamımızda (Vercel) `x-real-ip` her
 * zaman ayarlı olduğundan bu yol gerçek trafikte hiç tetiklenmiyor; yalnızca
 * başlıkları düşüren bilinmeyen bir proxy senaryosuna karşı bir güvenlik
 * supabı.
 */
export function clientIp(headers: Headers): string | null {
  const real = headers.get('x-real-ip')
  if (real) return real.trim()

  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const parts = forwarded.split(',')
    const last = parts[parts.length - 1]
    if (last) return last.trim()
  }

  return null
}
