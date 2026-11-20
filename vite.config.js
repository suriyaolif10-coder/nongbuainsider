import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' ให้ deploy บน GitHub Pages ได้ทันที (ใช้ HashRouter)
export default defineConfig({
  base: './',
  plugins: [react()],
})
