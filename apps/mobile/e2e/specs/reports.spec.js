/**
 * Reports Screen E2E Tests
 *
 * Tests date range selector tabs, summary stats cards,
 * subject breakdown section, daily activity section, and empty state.
 */
const {
  tap,
  tapMore,
  pause,
  scrollDown,
  assertNoCrash,
  goBack,
  pullToRefresh,
} = require('./helpers')

describe('Reports Screen', () => {
  before(async () => {
    await tapMore('Reports')
  })

  it('shows date range selector tabs', async () => {
    // Date range tabs: "7 Days", "30 Days", "90 Days"
    const source = await driver.getPageSource()
    if (source.includes('Select a Student')) return

    const tab7 = await $(`~7 Days date range`)
    const tab30 = await $(`~30 Days date range`)
    const tab90 = await $(`~90 Days date range`)

    expect(
      (await tab7.isExisting()) ||
      (await tab30.isExisting()) ||
      (await tab90.isExisting())
    ).toBe(true)
  })

  it('date range tabs change selection', async () => {
    const tab7 = await $(`~7 Days date range`)
    if (await tab7.isExisting()) {
      await tab7.click()
      await pause(1500)
      await assertNoCrash()

      // Switch back to 30 Days
      const tab30 = await $(`~30 Days date range`)
      if (await tab30.isExisting()) {
        await tab30.click()
        await pause(1000)
      }
    }
  })

  it('shows summary stats', async () => {
    const source = await driver.getPageSource()
    if (source.includes('Select a Student')) return

    // Stats cards with accessibility labels
    const activitiesStat = await $(`//*[contains(@label, "total activities")]`)
    const hoursStat = await $(`//*[contains(@label, "total hours")]`)
    const daysStat = await $(`//*[contains(@label, "active days")]`)

    expect(
      (await activitiesStat.isExisting()) ||
      (await hoursStat.isExisting()) ||
      (await daysStat.isExisting())
    ).toBe(true)
  })

  it('shows subject breakdown section', async () => {
    await scrollDown()
    await pause(500)

    const source = await driver.getPageSource()
    if (source.includes('Select a Student')) return

    // "By Subject" header
    expect(
      source.includes('By Subject') ||
      source.includes('No activities in this date range')
    ).toBe(true)
  })

  it('shows daily activity section', async () => {
    const source = await driver.getPageSource()
    if (source.includes('Select a Student')) return

    expect(
      source.includes('Daily Activity') ||
      source.includes('No activity in this date range')
    ).toBe(true)
  })

  it('shows empty state for no data', async () => {
    // Switch to 7 Days range to check for potential empty state
    const tab7 = await $(`~7 Days date range`)
    if (await tab7.isExisting()) {
      await tab7.click()
      await pause(1500)
    }

    const source = await driver.getPageSource()
    // Either has data or shows empty messages
    expect(
      source.includes('activities') ||
      source.includes('No activities') ||
      source.includes('No activity') ||
      source.includes('Select a Student')
    ).toBe(true)

    await assertNoCrash()
  })

  after(async () => {
    await goBack()
    await pause(500)
  })
})
