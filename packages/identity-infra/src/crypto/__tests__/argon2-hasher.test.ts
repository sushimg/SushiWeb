import { describe, expect, it } from 'vitest'
import { Argon2Hasher } from '../argon2-hasher'

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
})
