import { test as base, type ElectronApplication, type Page } from '@playwright/test'
import { _electron as electron } from 'playwright'
import { resolve } from 'path'

/**
 * Shared Playwright fixture that launches the Electron app once per test file
 * and exposes the main renderer page.
 */
export const test = base.extend<{ electronApp: ElectronApplication; page: Page }>({
  electronApp: async ({}, use) => {
    const appPath = resolve(__dirname, '..')

    const app = await electron.launch({
      args: [appPath],
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    })

    await use(app)
    await app.close()
  },

  page: async ({ electronApp }, use) => {
    // Wait for the first BrowserWindow to appear
    const window = await electronApp.firstWindow()

    // Wait for the renderer to finish loading
    await window.waitForLoadState('domcontentloaded')

    await use(window)
  },
})

export { expect } from '@playwright/test'
