import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Kök .env.local'daki DATABASE_URL'i testlere taşır; yoksa Postgres
    // testleri kendini atlar.
    env: { ...process.env },
    setupFiles: ['./vitest.setup.ts'],
    // Postgres sözleşme testleri paylaşılan e-posta desenleriyle
    // ('%@example.com') temizlik yapıyor; dosyalar paralel koşarsa birinin
    // temizliği diğerinin test verisini yarış anında silebilir.
    fileParallelism: false,
  },
})
