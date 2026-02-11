import { defineConfig } from '@playwright/test'
import { resolve } from 'path'

/**
 * Playwright configuration for Electron E2E tests.
 *
 * Launch the built Electron app (or dev mode) and run
 * tests against the renderer process.
 */
export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  timeout: 30_000,
  retries: 1,
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'electron',
      use: {
        // Viewport matching the app's default window size
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'electron-hd',
      use: {
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
  // Output directory for test artifacts
  outputDir: resolve(__dirname, 'test-results'),
})
