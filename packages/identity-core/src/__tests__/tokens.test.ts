import { describe, expect, it } from 'vitest'
import { constantTimeEqual, generateToken, hashToken } from '../tokens'

describe('generateToken', () => {
  it('URL-güvenli karakterlerden oluşur', () => {
    expect(generateToken()).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('en az 32 baytlık entropi taşır', () => {
    // base64url'de 32 bayt = 43 karakter (padding'siz).
    expect(generateToken().length).toBeGreaterThanOrEqual(43)
  })

  it('her çağrıda farklı bir değer üretir', () => {
    const seen = new Set(Array.from({ length: 100 }, () => generateToken()))
    expect(seen.size).toBe(100)
  })
})

describe('hashToken', () => {
  it('SHA-256 hex özeti döner', async () => {
    // 'abc' için bilinen SHA-256 değeri.
    expect(await hashToken('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
  })

  it('aynı girdi için aynı çıktıyı verir', async () => {
    expect(await hashToken('sushi')).toBe(await hashToken('sushi'))
  })

  it('farklı girdiler için farklı çıktı verir', async () => {
    expect(await hashToken('a')).not.toBe(await hashToken('b'))
  })
})

describe('constantTimeEqual', () => {
  it('aynı dizeler için true döner', () => {
    expect(constantTimeEqual('abc', 'abc')).toBe(true)
  })

  it('farklı dizeler için false döner', () => {
    expect(constantTimeEqual('abc', 'abd')).toBe(false)
  })

  it('farklı uzunluklar için false döner', () => {
    expect(constantTimeEqual('abc', 'abcd')).toBe(false)
  })
})
