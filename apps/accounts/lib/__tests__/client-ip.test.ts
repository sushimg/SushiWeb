import { describe, expect, it } from 'vitest'
import { clientIp } from '../client-ip'

describe('clientIp', () => {
  it('x-real-ip her ikisi de varsa tercih edilir', () => {
    const headers = new Headers({
      'x-real-ip': '203.0.113.9',
      'x-forwarded-for': '198.51.100.1, 198.51.100.2',
    })
    expect(clientIp(headers)).toBe('203.0.113.9')
  })

  it('çok girişli x-forwarded-for içinde son giriş alınır', () => {
    const headers = new Headers({
      'x-forwarded-for': '198.51.100.1, 198.51.100.2, 198.51.100.3',
    })
    expect(clientIp(headers)).toBe('198.51.100.3')
  })

  it('boşluklar kırpılır', () => {
    const headers = new Headers({
      'x-forwarded-for': '198.51.100.1 ,   198.51.100.2  ',
    })
    expect(clientIp(headers)).toBe('198.51.100.2')
  })

  it('tek girişli liste doğru döner', () => {
    const headers = new Headers({
      'x-forwarded-for': '198.51.100.1',
    })
    expect(clientIp(headers)).toBe('198.51.100.1')
  })

  it('hiçbir başlık yoksa null döner (IP kovası atlanır)', () => {
    const headers = new Headers()
    expect(clientIp(headers)).toBeNull()
  })
})
