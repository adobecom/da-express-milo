import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const base = command === 'serve' ? '/' : '/tools/pdp-page-gen/dist/'

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
      port: 3001,
    },
    preview: {
      port: 4174,
      proxy: {
        '^/tools/pdp-page-gen/dist': {
          target: 'http://localhost:4174',
          rewrite: (path) => path.replace(/^\/tools\/pdp-page-gen\/dist/, ''),
        }
      }
    }
  }
})
