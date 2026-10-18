import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The app talks to Supabase directly, so there is no local /api proxy any more.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
})
