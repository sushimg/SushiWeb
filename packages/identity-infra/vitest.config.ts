import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Kök .env.local'daki DATABASE_URL'i testlere taşır; yoksa Postgres
    // testleri kendini atlar.
    env: { ...process.env },
    setupFiles: ['./vitest.setup.ts'],
  },
})
