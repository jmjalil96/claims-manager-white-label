import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules', 'dist', '**/*.test.{ts,tsx}'],
    },
  },
  resolve: {
    alias: {
      '@': `${__dirname}src`,
      '@claims/shared': `${__dirname}../../packages/shared/src`,
    },
  },
})
