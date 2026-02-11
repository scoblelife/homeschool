import { test, expect } from './electron.fixture'

test.describe('Dashboard', () => {
  test('loads and displays app title', async ({ page }) => {
    // Sidebar should render with app branding
    await expect(page.locator('h1', { hasText: 'Homeschool' })).toBeVisible({ timeout: 15_000 })
  })

  test('displays student selector', async ({ page }) => {
    // Student selector dropdown should be present in sidebar
    const selector = page.locator('select')
    await expect(selector).toBeVisible({ timeout: 15_000 })

    // Should have "All Students" option
    await expect(selector.locator('option', { hasText: 'All Students' })).toBeVisible()
  })

  test('renders dashboard content area', async ({ page }) => {
    // Wait for the main content to load
    await page.waitForLoadState('domcontentloaded')

    // The main content area should be present
    const mainContent = page.locator('main')
    await expect(mainContent).toBeVisible({ timeout: 15_000 })
  })

  test('sidebar navigation items are visible', async ({ page }) => {
    const navLabels = ['Dashboard', 'Learning Log', 'Milestones', 'Calendar', 'Curriculum', 'Reports']

    for (const label of navLabels) {
      await expect(page.locator('nav').getByText(label)).toBeVisible({ timeout: 10_000 })
    }
  })

  test('settings link is visible at bottom of sidebar', async ({ page }) => {
    await expect(page.getByText('Settings')).toBeVisible({ timeout: 10_000 })
  })
})
