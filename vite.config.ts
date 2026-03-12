import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 从环境变量获取后端端口，默认 7143
const backendPort = parseInt(process.env.BACKEND_PORT || process.env.PORT || '7143')

export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'public',
  server: {
    host: "0.0.0.0",
    port: 5173,
    // 将所有非前端请求代理到后端
    proxy: {
      '/api': `http://localhost:${backendPort}`,
      '/v1': `http://localhost:${backendPort}`,
      '/v1beta': `http://localhost:${backendPort}`,
      '/ws': {
        target: `ws://localhost:${backendPort}`,
        ws: true,
      },
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
