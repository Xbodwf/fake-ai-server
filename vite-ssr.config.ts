import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import reactSwc from '@vitejs/plugin-react-swc'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    reactSwc(),
    legacy({
      targets: ['Chrome >= 90'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      modernPolyfills: true,
      renderLegacyChunks: true,
    }),
  ],
  root: '.',
  publicDir: 'public',
  
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('@mui')) {
              return 'vendor-mui';
            }
            if (id.includes('axios') || id.includes('i18next') || id.includes('react-i18next')) {
              return 'vendor-utils';
            }
          }
        },
      },
      onwarn(warning, warn) {
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') {
          return
        }
        warn(warning)
      },
    },
  },
  
  resolve: {
    alias: {
      '@': '/src/frontend',
    },
  },
})