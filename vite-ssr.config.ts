import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['Chrome >= 90', 'Firefox >= 88', 'Safari >= 14', 'Edge >= 90'],
      additionalLegacyPolyfills: [
        'regenerator-runtime/runtime',
        'core-js/modules/es.promise.js',
        'core-js/modules/es.array.includes.js',
        'core-js/modules/es.object.assign.js',
        'core-js/modules/es.string.includes.js',
        'core-js/modules/es.symbol.js',
        'core-js/modules/es.array.find.js',
        'core-js/modules/es.array.from.js',
      ],
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