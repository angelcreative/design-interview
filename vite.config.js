import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/tweet-binder-analyzer/', // Esto es importante para GitHub Pages
  build: {
    outDir: 'dist',
  }
})