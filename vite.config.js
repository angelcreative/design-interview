import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/tweet-binder-analyzer/', // Nombre de tu repositorio
})