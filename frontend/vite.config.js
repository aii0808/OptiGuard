import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function copy404Plugin() {
  return {
    name: 'copy-404-fallback',
    closeBundle() {
      const dist = path.resolve(__dirname, 'dist')
      const indexHtml = path.join(dist, 'index.html')
      if (!fs.existsSync(indexHtml)) return

      // 1. Fallback 404.html
      fs.copyFileSync(indexHtml, path.join(dist, '404.html'))

      // 2. Physical directory fallbacks for every route so deep links and refresh ALWAYS return 200 OK
      const routes = ['login', 'register', 'dashboard', 'webgis', 'tiket', 'tugas', 'laporan', 'profil', 'approval']
      for (const r of routes) {
        const dir = path.join(dist, r)
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
        fs.copyFileSync(indexHtml, path.join(dir, 'index.html'))
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), copy404Plugin()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
