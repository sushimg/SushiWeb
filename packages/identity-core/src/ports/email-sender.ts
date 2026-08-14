/**
 * E-posta gönderim portu.
 *
 * Çekirdek e-postanın nasıl gittiğini bilmez. Bugün konsola yazılıyor,
 * yarın bir servise gidecek; ikisi de bu arayüzü karşılar.
 *
 * `send` başarısız olursa fırlatır. Çağıran akışların çoğu bunu yutar:
 * doğrulama e-postası gönderilemedi diye kayıt geri alınmamalı, kullanıcı
 * daha sonra yeniden gönderim isteyebilir.
 */
export interface OutgoingEmail {
  to: string
  subject: string
  body: string
}

export interface EmailSender {
  send(email: OutgoingEmail): Promise<void>
}
