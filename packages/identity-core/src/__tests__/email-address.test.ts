import { describe, expect, it } from 'vitest'
import { isPlausibleEmail, normalizeEmail } from '../email-address'

describe('normalizeEmail', () => {
  it('küçük harfe çevirir', () => {
    expect(normalizeEmail('Mustafa@Example.COM')).toBe('mustafa@example.com')
  })

  it('baştaki ve sondaki boşlukları kırpar', () => {
    expect(normalizeEmail('  a@b.com  ')).toBe('a@b.com')
  })

  it('içerideki noktaları ve artıları korur', () => {
    // Gmail bunları yok sayar ama bu bir sunucu kararıdır, bizim değil.
    // Adresi değiştirmek, kullanıcının kaydolduğu adrese posta gitmemesi
    // demek olabilir.
    expect(normalizeEmail('a.b+etiket@example.com')).toBe('a.b+etiket@example.com')
  })
})

describe('isPlausibleEmail', () => {
  it('sıradan adresi kabul eder', () => {
    expect(isPlausibleEmail('mustafa@example.com')).toBe(true)
  })

  it('alt alan adlı adresi kabul eder', () => {
    expect(isPlausibleEmail('a@mail.example.co.uk')).toBe(true)
  })

  it('@ içermeyeni reddeder', () => {
    expect(isPlausibleEmail('mustafa.example.com')).toBe(false)
  })

  it('alan adı noktasız olanı reddeder', () => {
    expect(isPlausibleEmail('mustafa@localhost')).toBe(false)
  })

  it('boşluk içereni reddeder', () => {
    expect(isPlausibleEmail('mus tafa@example.com')).toBe(false)
  })

  it('boş dizeyi reddeder', () => {
    expect(isPlausibleEmail('')).toBe(false)
  })
})
