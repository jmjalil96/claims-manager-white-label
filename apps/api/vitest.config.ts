import { defineConfig } from 'vitest/config'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'

// Load test environment variables
const __dirname = fileURLToPath(new URL('.', import.meta.url))
config({ path: `${__dirname}.env.test` })

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/test/setup.ts'],
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules', 'dist', '**/*.test.ts'],
    },
  },
})
