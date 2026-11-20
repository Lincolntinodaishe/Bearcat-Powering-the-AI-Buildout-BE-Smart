import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Dev: forward /api to the FastAPI backend (python -m uvicorn backend.app:app --port 8000)
  server: { proxy: { '/api': 'http://localhost:8000' } },
  // Prod: FastAPI serves the built app from backend/static (one Render service, one URL)
  build: { outDir: 'backend/static', emptyOutDir: true },
})
