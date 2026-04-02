import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl()
  ],
  server: {
    host: true,
    https: true,
    proxy: {
      '/ws': {
        target: 'http://localhost:8080',
        ws: true,
        secure: false, // Ignorar problemas de SSL del backend (en caso de que hubiera)
        changeOrigin: true
      }
    }
  }
})
