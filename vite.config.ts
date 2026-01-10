import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: ['tmgcompetitions.co.uk', ' https://subject-bibliographic-cons-itunes.trycloudflare.com', 'localhost:5173']
  },
  server: {
    allowedHosts: ['tmgcompetitions.co.uk']
  }
})