import { describe, expect, it } from 'vitest'
import { HibpBreachChecker } from '../hibp-breach-checker'

/** 'password' kelimesinin SHA-1'i: 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8 */
const PASSWORD_PREFIX = '5BAA6'
const PASSWORD_SUFFIX = '1E4C9B93F3F0682250B6CF8331B7EE68FD8'

function fakeFetch(body: string, status = 200) {
  const calls: string[] = []
  const impl = async (url: string | URL | Request) => {
    calls.push(String(url))
    return new Response(body, { status })
  }
  return { impl: impl as unknown as typeof fetch, calls }
}

describe('HibpBreachChecker', () => {
  it('sızmış parolayı bulur', async () => {
    const { impl } = fakeFetch(`${PASSWORD_SUFFIX}:12345\nAAAA:1`)
    expect(await new HibpBreachChecker(impl).isBreached('password')).toBe(true)
  })

  it('sızmamış parola için false döner', async () => {
    const { impl } = fakeFetch('AAAABBBB:1\nCCCCDDDD:2')
    expect(await new HibpBreachChecker(impl).isBreached('password')).toBe(false)
  })

  it('parolanın yalnızca ilk 5 hash karakterini gönderir', async () => {
    // k-anonymity: tam hash gönderilseydi, hangi parolayı sorduğumuz
    // servis tarafından bilinirdi.
    const { impl, calls } = fakeFetch('AAAA:1')
    await new HibpBreachChecker(impl).isBreached('password')
    expect(calls[0]).toContain(PASSWORD_PREFIX)
    expect(calls[0]).not.toContain(PASSWORD_SUFFIX)
  })

  it('büyük/küçük harf farkına takılmaz', async () => {
    const { impl } = fakeFetch(`${PASSWORD_SUFFIX.toLowerCase()}:5`)
    expect(await new HibpBreachChecker(impl).isBreached('password')).toBe(true)
  })

  it('servis hata verirse false döner', async () => {
    // Fail open, bilinçli: sızıntı servisi çöktüğünde kimse kayıt olamaz
    // hâle gelmemeli. Bu kontrol bir savunma katmanı, tek savunma değil.
    const { impl } = fakeFetch('', 503)
    expect(await new HibpBreachChecker(impl).isBreached('password')).toBe(false)
  })

  it('ağ tamamen düşerse false döner', async () => {
    const impl = (async () => {
      throw new Error('network down')
    }) as unknown as typeof fetch
    expect(await new HibpBreachChecker(impl).isBreached('password')).toBe(false)
  })
})
