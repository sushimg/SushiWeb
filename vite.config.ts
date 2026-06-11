import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: { ignored: ['**/_framer_backup/**'] },
  },
  optimizeDeps: {
    exclude: [],
    entries: ['src/**/*.{ts,tsx}'],
  },
  build: {
    // Modern output — no legacy transpilation/polyfills, smaller & faster JS.
    target: 'esnext',
    cssCodeSplit: true,
    modulePreload: { polyfill: false },
    rollupOptions: {
      output: {
        // Split stable vendor code so it caches independently of app code and
        // the motion runtime loads as its own chunk.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (/framer-motion|motion-dom|motion-utils/.test(id)) return 'motion'
          if (/[\\/]react|[\\/]scheduler[\\/]/.test(id)) return 'react'
        },
      },
    },
  },
})
