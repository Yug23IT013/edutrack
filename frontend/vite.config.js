import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild', // Use esbuild (faster and included with Vite)
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: undefined // Let Vite handle chunking automatically
      }
    }
  },
  define: {
    'process.env': {}
  }
})
