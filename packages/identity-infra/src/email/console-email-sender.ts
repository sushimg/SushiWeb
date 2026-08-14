import type { EmailSender, OutgoingEmail } from '@sushi/identity-core'

/**
 * E-postayı göndermez, yazar. Geliştirme için ve gerçek gönderim
 * eklenene kadar.
 *
 * Log fonksiyonu dışarıdan alınır: testler onu yakalayabilsin, ve üretimde
 * yanlışlıkla kullanılırsa çıktı uygulamanın log hattına düşsün.
 */
export class ConsoleEmailSender implements EmailSender {
  private readonly log: (message: string) => void

  constructor(log: (message: string) => void = console.log) {
    this.log = log
  }

  async send(email: OutgoingEmail): Promise<void> {
    this.log(
      [
        '--- E-POSTA (gönderilmedi, yalnızca yazıldı) ---',
        `Alıcı : ${email.to}`,
        `Konu  : ${email.subject}`,
        '',
        email.body,
        '--- son ---',
      ].join('\n'),
    )
  }
}
