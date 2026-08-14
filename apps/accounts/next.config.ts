import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { NextConfig } from 'next'

/**
 * Next.js yalnızca uygulama dizinindeki .env.local'ı okur, oysa yerel
 * geliştirme sırlarını (DATABASE_URL gibi) repo kökündeki .env.local'da
 * tutuyoruz — tek doğruluk kaynağı için. `packages/identity-infra/vitest.setup.ts`
 * ile aynı yöntem: elle okuyup ayrıştırıyoruz, zaten ayarlı değişkenlerin
 * üzerine yazmıyoruz (Vercel'de gerçek değerler platform ortamından gelir ve
 * kazanmalı). Dosya yoksa (üretimde olduğu gibi) sessizce geçiyoruz.
 */
try {
  const contents = readFileSync(join(import.meta.dirname, '../../.env.local'), 'utf8')
  // Satırları hem `\n` hem `\r\n` için bölüyoruz (bkz.
  // packages/identity-infra/src/db/parse-dotenv.ts — aynı ayrıştırma orada
  // birim testliyken burada Next'in config yükleyicisi ayrı bir çalışma
  // zamanı olduğu için mantığı yinelemek zorundayız): Windows'ta checkout
  // CRLF getirirse, bölmeyi yalnızca `\n`'de yapmak değerin sonuna görünmez
  // bir `\r` bırakır. `DATABASE_URL` buna dayanıklıdır ama `APP_URL` gibi bir
  // URL'in sonuna eklenince bağlantıyı sessizce bozar.
  for (const line of contents.split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*\r?$/.exec(line)
    if (match?.[1] && !process.env[match[1]]) {
      process.env[match[1]] = match[2]?.replace(/^["']|["']$/g, '')
    }
  }
} catch {
  // Kök .env.local yok — üretimde beklenen durum bu.
}

// Yerel geliştirmede APP_URL için makul bir varsayılan: taze bir klonun
// yalnızca DATABASE_URL ayarlayarak çalışabilmesi için. Üretimde platform
// ortam değişkeni zaten ayarlı olacağından burada dokunulmaz.
if (!process.env.APP_URL) {
  process.env.APP_URL = 'http://localhost:3001'
}

const config: NextConfig = {
  // Workspace paketleri TypeScript kaynağı olarak yayınlanıyor (derlenmiş
  // değil), bu yüzden Next'in onları kendi derleme hattından geçirmesi gerekir.
  transpilePackages: ['@sushi/identity-core', '@sushi/identity-infra'],
}

export default config
