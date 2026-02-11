import { test, expect } from './electron.fixture'

test.describe('Learning Log', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Learning Log
    await page.locator('nav').getByText('Learning Log').click()
    await page.waitForLoadState('domcontentloaded')
  })

  test('navigates to Learning Log page', async ({ page }) => {
    // Verify we're on the log page by checking URL or content
    await expect(page).toHaveURL(/\/log/)
  })

  test('displays activity logging interface', async ({ page }) => {
    // Wait for the page content to render
    const mainContent = page.locator('main')
    await expect(mainContent).toBeVisible({ timeout: 10_000 })
  })

  test('can interact with student selector', async ({ page }) => {
    // The student selector should still be visible in sidebar
    const selector = page.locator('select')
    await expect(selector).toBeVisible()

    // Select "All Students" option
    await selector.selectOption({ label: 'All Students' })
  })
})
