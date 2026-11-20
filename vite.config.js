import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' ให้ deploy บน GitHub Pages ได้ทันที (ใช้ HashRouter)
export default defineConfig({
  base: './',
  plugins: [react()],
  // ภาพในโค้ด (โลโก้/Hero) ฝังเป็น base64 data URI ในไฟล์ build -> ไม่มีภาพเสีย
  build: { assetsInlineLimit: 64 * 1024 },
  define: {
    // แสดงเวลา build ในหน้า Login เพื่อเช็กว่าได้เว็บเวอร์ชันล่าสุดหรือยัง
    __BUILD__: JSON.stringify(new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'short', timeStyle: 'short' })),
  },
})
