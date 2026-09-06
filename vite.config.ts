import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages serves the app from /KeepScore/, while Netlify serves it from /
  base: process.env.NETLIFY ? '/' : '/KeepScore/',
  plugins: [react()],
})
