import type { RateLimiter } from '@sushi/identity-core'
import { sql } from '../db/client'

function windowStart(now: Date, windowMs: number): Date {
  return new Date(Math.floor(now.getTime() / windowMs) * windowMs)
}

/**
 * Postgres tabanlı sabit pencere sayacı.
 *
 * Vercel'de istekler arasında paylaşılan bellek yoktur, bu yüzden sayaç
 * veritabanında durur. Artırma tek bir upsert ile yapılır ve güncel değeri
 * RETURNING ile geri verir: "oku, artır, yaz" üçlüsü olsaydı eşzamanlı
 * istekler birbirinin artışını ezer ve sınır kâğıt üstünde kalırdı.
 */
export class PostgresRateLimiter implements RateLimiter {
  async hit(
    bucket: string,
    subject: string,
    limit: number,
    windowMs: number,
    now: Date,
  ): Promise<boolean> {
    const start = windowStart(now, windowMs).toISOString()
    const rows = (await sql()`
      insert into rate_limits (bucket, subject, window_start, count)
      values (${bucket}, ${subject}, ${start}, 1)
      on conflict (bucket, subject, window_start)
        do update set count = rate_limits.count + 1
      returning count
    `) as Array<{ count: number }>

    return (rows[0]?.count ?? Number.MAX_SAFE_INTEGER) <= limit
  }
}
