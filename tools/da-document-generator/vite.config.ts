import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => {
  // Served from this repo's code bus at /pdp-document-generator/dist/ (NOT the old
  // da-express-milo /tools/... path). Must match the subfolder or assets 404 (blank page).
  const base = command === 'serve' ? '/' : '/tools/da-document-generator/dist/'

  return {
    plugins: [react(), tailwindcss()],
    base,
    build: {
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name].js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: 'assets/[name].[ext]',
        },
      },
    },
    server: {
      port: 3000,
    },
  }
})
