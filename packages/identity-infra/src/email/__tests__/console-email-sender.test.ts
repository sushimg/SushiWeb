import { describe, expect, it } from 'vitest'
import { ConsoleEmailSender } from '../console-email-sender'

describe('ConsoleEmailSender', () => {
  it('alıcıyı, konuyu ve gövdeyi yazar', async () => {
    const lines: string[] = []
    await new ConsoleEmailSender(m => lines.push(m)).send({
      to: 'mustafa@example.com',
      subject: 'Hesabını doğrula',
      body: 'https://accounts.example.com/verify?token=abc',
    })
    const output = lines.join('\n')
    expect(output).toContain('mustafa@example.com')
    expect(output).toContain('Hesabını doğrula')
    expect(output).toContain('https://accounts.example.com/verify?token=abc')
  })

  it('her e-posta için tek bir çağrı yapar', async () => {
    const lines: string[] = []
    const sender = new ConsoleEmailSender(m => lines.push(m))
    await sender.send({ to: 'a@b.c', subject: 's', body: 'b' })
    await sender.send({ to: 'd@e.f', subject: 's', body: 'b' })
    expect(lines).toHaveLength(2)
  })
})
