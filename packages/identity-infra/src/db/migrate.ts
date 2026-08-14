/**
 * Migration'ları sırayla uygular ve uygulananları kaydeder.
 *
 * Kasıtlı olarak aptal: dosyaları isme göre sıralar, daha önce
 * uygulanmamış olanları çalıştırır, adını yazar. Geri alma (down) yok —
 * ileri doğru düzeltme, geri alma mekanizmasından daha güvenilirdir.
 *
 * Neon'un HTTP sürücüsü değil, klasik `pg` sürücüsü kullanılır: HTTP
 * sürücüsü tek çağrıda birden fazla SQL ifadesi çalıştırmaz ve migration
 * dosyaları tanım gereği çok ifadelidir. Ayrıca her dosya tek bir
 * transaction içinde koşar — yarıda kalan bir migration şemayı yarım
 * bırakmaz. Bu script yalnızca elle, terminalden çalışır; uygulamanın
 * çalışma zamanı yolunda yer almaz.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Client } from 'pg'
import { readDatabaseUrl } from './env.ts'

const MIGRATIONS_DIR = join(import.meta.dirname, '../../../../db/migrations')

async function main(): Promise<void> {
  const client = new Client({ connectionString: readDatabaseUrl(process.env) })
  await client.connect()

  try {
    await client.query(`
      create table if not exists schema_migrations (
        name       text primary key,
        applied_at timestamptz not null default now()
      )
    `)

    const { rows } = await client.query<{ name: string }>(
      'select name from schema_migrations',
    )
    const applied = new Set(rows.map(row => row.name))

    const files = readdirSync(MIGRATIONS_DIR)
      .filter(name => name.endsWith('.sql'))
      .sort()

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`atlandı   ${file}`)
        continue
      }
      const contents = readFileSync(join(MIGRATIONS_DIR, file), 'utf8')
      await client.query('begin')
      try {
        await client.query(contents)
        await client.query(
          'insert into schema_migrations (name) values ($1)',
          [file],
        )
        await client.query('commit')
      } catch (error) {
        await client.query('rollback')
        throw new Error(`${file} uygulanamadı: ${String(error)}`)
      }
      console.log(`uygulandı ${file}`)
    }

    console.log('migration tamam')
  } finally {
    await client.end()
  }
}

await main()
