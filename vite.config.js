import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  optimizeDeps: {
    force: true, // re-run dep optimization to avoid 504 Outdated Optimize Dep
  },
})
