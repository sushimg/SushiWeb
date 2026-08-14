import { describe, expect, it } from 'vitest'
import { parseDotenv } from '../parse-dotenv'

describe('parseDotenv', () => {
  it('LF ile ayrılmış satırları ayrıştırır', () => {
    expect(parseDotenv('A=1\nB=2\n')).toEqual({ A: '1', B: '2' })
  })

  it('CRLF ile ayrılmış satırlarda değere sızan \\r bırakmaz', () => {
    const values = parseDotenv('APP_URL=http://localhost:3001\r\nDATABASE_URL=postgresql://x\r\n')
    expect(values.APP_URL).toBe('http://localhost:3001')
    expect(values.APP_URL?.includes('\r')).toBe(false)
    expect(values.DATABASE_URL).toBe('postgresql://x')
  })

  it('tırnaklı değerlerin tırnağını soyar', () => {
    expect(parseDotenv('A="hello"\r\nB=\'world\'\r\n')).toEqual({ A: 'hello', B: 'world' })
  })

  it('boş ve yorum benzeri satırları yok sayar', () => {
    expect(parseDotenv('\n# yorum degil ama esler de değil\nA=1\n')).toEqual({ A: '1' })
  })

  it('zaten ayarlı değişkenlerin üzerine yazılıp yazılmayacağına çağıran karar verir — bu fonksiyon salt ayrıştırır', () => {
    expect(parseDotenv('A=1')).toEqual({ A: '1' })
  })
})
