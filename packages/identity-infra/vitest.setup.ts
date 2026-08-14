import { readFileSync } from 'node:fs'
import { join } from 'node:path'

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
  for (const line of contents.split('\n')) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
    if (match?.[1] && !process.env[match[1]]) {
      process.env[match[1]] = match[2]?.replace(/^["']|["']$/g, '')
    }
  }
} catch {
  // .env.local yok — veritabanı testleri atlanacak.
}
