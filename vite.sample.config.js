// Builds only the ink-study sample page (sample.html) with relative paths, for a private preview.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  build: { rolldownOptions: { input: 'sample.html' } },
})
