import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    testTimeout: 30000,
    exclude: ['node_modules', 'dist', 'out', 'mobile'],
    // Use jsdom for React component tests, node for sync tests
    environmentMatchGlobs: [
      ['src/renderer/**/*.{test,spec}.tsx', 'jsdom'],
      ['src/renderer/**/*.{test,spec}.ts', 'jsdom'],
      ['src/sync/**/*.{test,spec}.ts', 'node'],
    ],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer/src'),
    },
  },
})
