import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseDotenv } from './src/db/parse-dotenv'

/**
 * Kök .env.local'ı okur. Node'un --env-file bayrağı Vitest süreci için
 * geçerli olmadığından, ortamı burada elle kuruyoruz. Dosya yoksa sessizce
 * geçilir — o durumda veritabanı testleri kendini atlar.
 */
try {
  const contents = readFileSync(
    join(import.meta.dirname, '../../.env.local'),
    'utf8',
  )
  for (const [name, value] of Object.entries(parseDotenv(contents))) {
    if (!process.env[name]) process.env[name] = value
  }
} catch {
  // .env.local yok — veritabanı testleri atlanacak.
}
