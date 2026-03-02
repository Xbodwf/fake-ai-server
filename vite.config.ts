import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'public',
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      '/api': 'http://localhost:7143',
      '/v1': 'http://localhost:7143',
    },
  },
  build: {
    outDir: 'dist/frontend',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': '/src/frontend',
    },
  },
})
