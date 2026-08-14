import { neon, type NeonQueryFunction } from '@neondatabase/serverless'
import { readDatabaseUrl } from './env.ts'

let client: NeonQueryFunction<false, false> | null = null

/**
 * Etiketli şablon sorgu fonksiyonu. İlk kullanımda oluşturulur, import
 * anında değil: modül düzeyinde bir çağrı, bu dosyayı yalnızca import eden
 * ama hiç sorgu yapmayan sayfalar için build sırasında patlardı.
 *
 * Her zaman şablon etiketi olarak kullan, böylece değerler parametrelenir:
 *   const rows = await sql()`select * from accounts where email = ${email}`
 * Sorguyu asla dize birleştirmeyle kurma.
 */
export function sql(): NeonQueryFunction<false, false> {
  if (client) return client
  client = neon(readDatabaseUrl(process.env))
  return client
}

/** Test dikişi. Ezberlenmiş istemciyi temizler ki yeni ortam etkili olsun. */
export function resetDbClient(): void {
  client = null
}
