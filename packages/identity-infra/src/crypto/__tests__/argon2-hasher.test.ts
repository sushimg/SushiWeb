import { describe, expect, it } from 'vitest'
import { Argon2Hasher } from '../argon2-hasher'
import { DUMMY_HASH } from '@sushi/identity-core'

const hasher = new Argon2Hasher()

describe('Argon2Hasher', () => {
  it('doğru parolayı doğrular', async () => {
    const hash = await hasher.hash('dogru-parola-123')
    expect(await hasher.verify('dogru-parola-123', hash)).toBe(true)
  })

  it('yanlış parolayı reddeder', async () => {
    const hash = await hasher.hash('dogru-parola-123')
    expect(await hasher.verify('yanlis-parola-123', hash)).toBe(false)
  })

  it('aynı parola için her seferinde farklı hash üretir', async () => {
    // Rastgele tuz olmasaydı, iki kullanıcının aynı parolayı seçtiği
    // veritabanından okunabilirdi.
    const a = await hasher.hash('ayni-parola-123')
    const b = await hasher.hash('ayni-parola-123')
    expect(a).not.toBe(b)
  })

  it('argon2id formatında hash üretir', async () => {
    expect(await hasher.hash('parola-123456')).toMatch(/^\$argon2id\$/)
  })

  it('bozuk hash için fırlatmaz, false döner', async () => {
    // Veritabanında bozulmuş bir satır, giriş uçunu 500 ile düşürmemeli.
    expect(await hasher.verify('parola-123456', 'bu-bir-hash-degil')).toBe(false)
  })

  it('boş hash için false döner', async () => {
    expect(await hasher.verify('parola-123456', '')).toBe(false)
  })

  it('DUMMY_HASH gerçek bir Argon2id doğrulaması olarak işlenir, hızlıca reddedilmez', async () => {
    // login.ts'deki DUMMY_HASH, hesap yokken de doğrulamanın gerçekten
    // koşmasını sağlayarak zamanlama saldırısını önler. Bu ancak sabit
    // koddaki parametreler geçerli ve maliyetli bir Argon2id hash'ini
    // gösterirse işe yarar. Süre ölçümü yerine, açıkça bozuk bir dizeyle
    // kıyaslıyoruz: gerçek ayrıştırma+hesaplama yapan bir doğrulama, anında
    // reddedilen bozuk bir girdiden ölçülebilir şekilde daha uzun sürmeli.
    const malformedStart = performance.now()
    const malformedResult = await hasher.verify('herhangi-bir-parola', 'not-a-hash')
    const malformedElapsed = performance.now() - malformedStart

    const dummyStart = performance.now()
    const dummyResult = await hasher.verify('herhangi-bir-parola', DUMMY_HASH)
    const dummyElapsed = performance.now() - dummyStart

    expect(malformedResult).toBe(false)
    expect(dummyResult).toBe(false)
    // Bozuk dizeyi ayrıştırmak neredeyse anındadır; gerçek bir Argon2id
    // hesaplaması onlarca kat daha uzun sürer. Gevşek bir eşik (10x)
    // kullanıyoruz ki yüklü CI makinelerinde kırılgan olmasın.
    expect(dummyElapsed).toBeGreaterThan(malformedElapsed * 10)
  })
})
