/**
 * `.env.local` tarzı bir dosyanın içeriğini `İSİM=değer` çiftlerine ayrıştırır.
 *
 * Windows'ta git CRLF ile checkout edebilir, bu yüzden satırları hem `\n` hem
 * `\r\n` için bölüyoruz. Bunu yapmazsak, değerin sonunda görünmez bir `\r`
 * kalır — Postgres sürücüsü buna tolerans gösterdiği için `DATABASE_URL`
 * masum görünür, ama `APP_URL` gibi bir URL'nin sonuna eklenince bağlantıyı
 * sessizce bozar (`http://localhost:3001%0D/...`).
 */
export function parseDotenv(contents: string): Record<string, string> {
  const values: Record<string, string> = {}
  for (const line of contents.split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*\r?$/.exec(line)
    if (!match?.[1]) continue
    values[match[1]] = (match[2] ?? '').replace(/^["']|["']$/g, '')
  }
  return values
}
