import { describe, expect, it } from 'vitest'
import { readDatabaseUrl } from '../env'

describe('readDatabaseUrl', () => {
  it('geçerli bağlantı dizesini döner', () => {
    const url = 'postgresql://user:pw@host/db'
    expect(readDatabaseUrl({ DATABASE_URL: url })).toBe(url)
  })

  it('postgres:// önekini de kabul eder', () => {
    const url = 'postgres://user:pw@host/db'
    expect(readDatabaseUrl({ DATABASE_URL: url })).toBe(url)
  })

  it('değişken yoksa kurulum dokümanını gösteren hata verir', () => {
    expect(() => readDatabaseUrl({})).toThrow(/database-setup/)
  })

  it('yanlış önekli değeri reddeder', () => {
    // Yanlış sırrı yapıştırmak, aksi hâlde çok sonra ve hiçbir değişken
    // adı içermeyen bir bağlantı hatasıyla patlar.
    expect(() => readDatabaseUrl({ DATABASE_URL: 'vercel_blob_rw_xxx' }))
      .toThrow(/postgresql:\/\//)
  })
})
