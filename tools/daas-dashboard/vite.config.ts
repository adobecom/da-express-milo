import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const base = command === 'serve' ? '/' : '/tools/daas-dashboard/dist/'
  
  return {
    plugins: [react(), tailwindcss()],
    base,
    build: {
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name].js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: 'assets/[name].[ext]'
        }
      }
    },
    server: {
      port: 3000,
    },
    preview: {
      port: 4173,
      // Proxy to simulate serving dist folder at /tools/daas-dashboard/dist/
      proxy: {
        '^/tools/daas-dashboard/dist': {
          target: 'http://localhost:4173',
          rewrite: (path) => path.replace(/^\/tools\/daas-dashboard\/dist/, ''),
        }
      }
    }
  }
})
