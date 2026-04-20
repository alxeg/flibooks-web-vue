import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Determine API version from environment (default to v1)
const API_VERSION = process.env.VITE_API_VERSION || 'v1'

// Set proxy target based on API version
const API_TARGET = API_VERSION === 'v2' ? 'http://localhost:3000' : 'http://localhost:8000'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
      },
    },
  },
})
