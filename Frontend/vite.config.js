import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: ['jwt-decode', 'qrcode']
  },
  plugins: [react()],
  build: {
    // Optimize build output
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // Remove console logs in production
        drop_debugger: true
      }
    },
    // Split chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          qr: ['qrcode', 'react-qr-code'],
          pdf: ['html2canvas', 'jspdf']
        }
      }
    },
    // Reduce chunk size
    chunkSizeWarningLimit: 800,
    // Generate source maps only for production
    sourcemap: false
  }
})