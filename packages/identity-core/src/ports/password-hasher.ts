/**
 * Parola hash'leme portu.
 *
 * Çekirdek, hangi algoritmanın kullanıldığını bilmez — yalnızca "hash'le" ve
 * "doğrula" ister. Algoritma seçimi ve parametreleri adaptörün işidir, çünkü
 * ikisi de zamanla değişir: donanım hızlandıkça maliyet parametresi artar.
 */
export interface PasswordHasher {
  hash(password: string): Promise<string>
  /** Hash bozuk veya tanınmayan formatta ise fırlatmaz, false döner. */
  verify(password: string, hash: string): Promise<boolean>
}
