/**
 * Storybook Test Runner Configuration
 *
 * Provides visual regression testing using Playwright screenshots.
 * Compares current renders against baseline images.
 */

import type { TestRunnerConfig } from '@storybook/test-runner'
import { toMatchImageSnapshot } from 'jest-image-snapshot'

// Extend Jest matchers
expect.extend({ toMatchImageSnapshot })

const config: TestRunnerConfig = {
  setup() {
    // Setup runs once before all tests
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

    // Take screenshot
    const screenshot = await page.screenshot({
      fullPage: false,
      animations: 'disabled',
    })

    // Compare with baseline
    expect(screenshot).toMatchImageSnapshot({
      customSnapshotIdentifier: storyId,
      failureThreshold: 0.01,
      failureThresholdType: 'percent',
      customSnapshotsDir: '.storybook/__image_snapshots__',
      customDiffDir: '.storybook/__diff_output__',
    })
  },
}

export default config
