import type { RateLimiter } from '@sushi/identity-core'

/** Pencerenin başlangıç anı — aynı pencereye düşen tüm istekler aynı anahtarı paylaşır. */
function windowStart(now: Date, windowMs: number): number {
  return Math.floor(now.getTime() / windowMs) * windowMs
}

export class InMemoryRateLimiter implements RateLimiter {
  private readonly counts = new Map<string, number>()

  async hit(
    bucket: string,
    subject: string,
    limit: number,
    windowMs: number,
    now: Date,
  ): Promise<boolean> {
    const key = `${bucket} ${subject} ${windowStart(now, windowMs)}`
    const next = (this.counts.get(key) ?? 0) + 1
    this.counts.set(key, next)
    return next <= limit
  }
}
