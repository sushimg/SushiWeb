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
