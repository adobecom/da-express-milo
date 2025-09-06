import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [],
  build: {
    lib: {
      entry: 'src/index.ts',
      fileName: (format) => `upload-service.min.${format}.js`,
      formats: ['es']
    },
    sourcemap: true,
    rollupOptions: {
      output: {
        chunkFileNames: '[name]-[hash].min.js',
      }
    }
  },
  define: {
    global: 'globalThis'
  },
  esbuild: {
    target: 'es2020'
  }
})
