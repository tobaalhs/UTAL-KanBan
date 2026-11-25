/// <reference types="vitest" />
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    // Redirige las peticiones /api al backend Express para evitar problemas de CORS en desarrollo
    proxy: {
      '/api': 'http://localhost:3000',
      // Socket.IO (tiempo real) usa WebSocket
      '/socket.io': { target: 'http://localhost:3000', ws: true },
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['src/**/*.test.js'],
  },
})
