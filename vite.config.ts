import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

/**
 * A static host serves index.html from cache, and a cached index.html points at
 * the previous build's hashed assets — so someone can sit on old code long after
 * a deploy. Stamping the build and publishing it lets the running app notice.
 */
const BUILD_ID = process.env.GITHUB_SHA?.slice(0, 8) ?? String(Date.now())

function emitVersion(): Plugin {
  return {
    name: 'crmo-version',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ buildId: BUILD_ID }),
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), emitVersion()],
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  // GitHub Pages serves the app from /<repo>/, so the base path is injected at
  // build time. Locally and on a custom domain it stays at the root.
  base: process.env.VITE_BASE_PATH ?? '/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: { port: 5173 },
})
