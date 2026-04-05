import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Force using the ESM build of satellite.js to avoid WASM build issues
      'satellite.js': path.resolve(__dirname, 'node_modules/satellite.js/dist/satellite.es.js')
    }
  },
  build: {
    target: 'esnext' // Support top-level await for modern browsers
  },
  optimizeDeps: {
    // Exclude wasm-build from pre-bundling to avoid IIFE format errors
    exclude: ['satellite.js/wasm-build']
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api/celestrak': {
        target: 'https://celestrak.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/celestrak/, '')
      }
    }
  }
})
