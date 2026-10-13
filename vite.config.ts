import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `--mode demo` genera un único HTML autocontenido (para compartir la demo como una página).
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), ...(mode === 'demo' ? [viteSingleFile()] : [])],
  base: './',
  build: mode === 'demo' ? { outDir: 'dist-demo' } : {},
}))
