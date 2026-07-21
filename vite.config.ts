import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command,isPreview }) => ({
  base: command === 'build'||isPreview ? '/MetroTyping/' : '/',
  plugins: [react()],
  test: { environment: 'jsdom', setupFiles: './src/test/setup.ts', include: ['src/**/*.test.{ts,tsx}'] },
}))
