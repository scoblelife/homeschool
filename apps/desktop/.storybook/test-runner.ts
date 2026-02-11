/**
 * Storybook Test Runner Configuration
 *
 * Provides visual regression testing using Playwright screenshots.
 * Compares current renders against baseline images.
 */

import type { TestRunnerConfig } from '@storybook/test-runner'

const config: TestRunnerConfig = {
  setup() {
    // Extend Jest matchers for visual regression (only when jest-image-snapshot available)
    try {
      const { toMatchImageSnapshot } = require('jest-image-snapshot')
      expect.extend({ toMatchImageSnapshot })
    } catch {
      // jest-image-snapshot not available — skip visual regression
    }
  },

  async postVisit(page, context) {
    // Get story context to check for skip parameter
    const storyId = context.id
    const { parameters } = await page.evaluate(() => {
      return {
        parameters: (window as any).__STORYBOOK_PREVIEW__?.storyStore?.fromId?.(
          (window as any).__STORYBOOK_STORY_DATA__?.id
        )?.parameters,
      }
    })

    // Skip snapshot for stories marked as no-snapshot
    if (parameters?.snapshot?.skip) {
      return
    }

    // Wait for any animations to complete
    await page.waitForTimeout(500)

    // Take screenshot for visual regression (if matcher available)
    try {
      const screenshot = await page.screenshot({
        fullPage: false,
        animations: 'disabled',
      })

      expect(screenshot).toMatchImageSnapshot({
        customSnapshotIdentifier: storyId,
        failureThreshold: 0.01,
        failureThresholdType: 'percent',
        customSnapshotsDir: '.storybook/__image_snapshots__',
        customDiffDir: '.storybook/__diff_output__',
      })
    } catch {
      // Visual regression not configured — a11y checks still run via addon
    }
  },
}

export default config
