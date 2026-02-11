import { test, expect } from './electron.fixture'

/**
 * Navigation smoke test — clicks every sidebar link and verifies
 * each page loads without crashing (no error boundary triggered).
 */
test.describe('Sidebar Navigation Smoke Test', () => {
  const sidebarLinks = [
    { label: 'Dashboard', path: '/' },
    { label: 'Learning Log', path: '/log' },
    { label: 'Milestones', path: '/milestones' },
    { label: 'Calendar', path: '/calendar' },
    { label: 'Curriculum', path: '/curriculum' },
    { label: 'Reports', path: '/reports' },
    { label: 'Settings', path: '/settings' },
  ]

  for (const link of sidebarLinks) {
    test(`navigates to ${link.label} without crashing`, async ({ page }) => {
      // Click the sidebar link
      const navLink = link.label === 'Settings'
        ? page.getByText(link.label)
        : page.locator('nav').getByText(link.label)

      await navLink.click()

      // Wait for page to settle
      await page.waitForTimeout(500)

      // Verify no error boundary is showing
      const errorBoundary = page.locator('text=Something went wrong')
      await expect(errorBoundary).not.toBeVisible()

      // Verify main content area is present and non-empty
      const mainContent = page.locator('main')
      await expect(mainContent).toBeVisible()

      // Verify the sidebar link is active (highlighted)
      await expect(navLink).toHaveClass(/brand-primaryDark|brand-primaryLight/)
    })
  }

  test('all pages via direct URL navigation', async ({ page }) => {
    const allRoutes = [
      '/',
      '/log',
      '/milestones',
      '/weekly-planner',
      '/calendar',
      '/reports',
      '/weekly-summary',
      '/annual-report',
      '/attendance',
      '/curriculum',
      '/hour-tracking',
      '/templates',
      '/recommendations',
      '/resources',
      '/library',
      '/field-trips',
      '/coop',
      '/api-services',
      '/settings',
    ]

    for (const route of allRoutes) {
      // Navigate via URL hash (Electron uses HashRouter typically, fallback to direct)
      await page.goto(`file://${route}`)
      await page.waitForTimeout(300)

      // Verify no crash — error boundary text should not appear
      const crashed = await page.locator('text=Something went wrong').isVisible()
      if (crashed) {
        throw new Error(`Page crashed on route: ${route}`)
      }
    }
  })
})
