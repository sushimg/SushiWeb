import { describe, expect, it } from 'vitest'
import {
  checkPassword,
  checkPasswordPolicy,
  type BreachChecker,
} from '../password-policy'

const neverBreached: BreachChecker = { isBreached: async () => false }
const alwaysBreached: BreachChecker = { isBreached: async () => true }

describe('checkPasswordPolicy', () => {
  it('12 karakterden kısa parolayı reddeder', () => {
    expect(checkPasswordPolicy('kisa123')).toBe('too-short')
  })

  it('tam 12 karakteri kabul eder', () => {
    expect(checkPasswordPolicy('123456789012')).toBeNull()
  })

  it('72 bayttan uzun parolayı reddeder', () => {
    // Üst sınır keyfi değil: Argon2 öncesi girdi boyutunu sınırlamak,
    // devasa parolalarla CPU tüketen bir saldırı yüzeyini kapatır.
    expect(checkPasswordPolicy('a'.repeat(73))).toBe('too-long')
  })

  it('uzunluğu bayt cinsinden ölçer, karakter cinsinden değil', () => {
    // Her emoji 4 bayt: 19 emoji = 76 bayt ama yalnızca 19 kod noktası.
    expect(checkPasswordPolicy('🍣'.repeat(19))).toBe('too-long')
  })

  it('kısa ama çok baytlı parolayı doğru sayar', () => {
    // 4 emoji = 16 bayt, ama 12 karakterlik alt sınırı bayt üzerinden geçer.
    expect(checkPasswordPolicy('🍣'.repeat(4))).toBeNull()
  })
})

describe('checkPassword', () => {
  it('yerel kural ihlalinde sızıntı kontrolüne hiç gitmez', async () => {
    let called = false
    const spy: BreachChecker = {
      isBreached: async () => {
        called = true
        return false
      },
    }
    expect(await checkPassword('kisa', spy)).toBe('too-short')
    expect(called).toBe(false)
  })

  it('sızmış parolayı reddeder', async () => {
    expect(await checkPassword('parolam123456', alwaysBreached)).toBe('breached')
  })

  it('geçerli ve sızmamış parolayı kabul eder', async () => {
    expect(await checkPassword('parolam123456', neverBreached)).toBeNull()
  })
})
