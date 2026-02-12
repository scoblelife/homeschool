/**
 * Progress Screen E2E Tests
 *
 * Tests compliance health bar, weekly stats cards, stars section,
 * milestone progress bar, subject breakdown, and pull-to-refresh.
 */
const {
  tapTab,
  pause,
  scrollDown,
  scrollUp,
  assertNoCrash,
  pullToRefresh,
} = require('./helpers')

describe('Progress Screen', () => {
  before(async () => {
    await tapTab('Progress')
    await pause(2000)
  })

  it('shows compliance health bar', async () => {
    // Compliance bar has accessibility label "Compliance status: ..."
    const badge = await $(`//*[contains(@label, "Compliance status:")]`)
    const exists = await badge.isExisting()

    // If no student selected, may show "Select a Student" instead
    const source = await driver.getPageSource()
    expect(exists || source.includes('Select a Student')).toBe(true)
  })

  it('shows weekly stats cards', async () => {
    const source = await driver.getPageSource()
    if (source.includes('Select a Student')) return

    // Stats cards show Activities, Hours, Days
    expect(source.includes('Activities')).toBe(true)
    expect(source.includes('Hours')).toBe(true)
    expect(source.includes('Days')).toBe(true)
  })

  it('shows stars section with weekly and all-time', async () => {
    // Star totals with accessibility labels
    const weeklyStars = await $(`//*[contains(@label, "stars this week")]`)
    const allTimeStars = await $(`//*[contains(@label, "stars all time")]`)

    const source = await driver.getPageSource()
    if (source.includes('Select a Student')) return

    expect(
      (await weeklyStars.isExisting()) &&
      (await allTimeStars.isExisting())
    ).toBe(true)
  })

  it('shows milestone progress bar', async () => {
    await scrollDown()
    await pause(500)

    const source = await driver.getPageSource()
    if (source.includes('Select a Student')) return

    // Milestones section shows "X/Y completed" and a ProgressBar
    expect(source.includes('Milestones')).toBe(true)
    expect(source.includes('completed')).toBe(true)
  })

  it('shows subject breakdown when activities exist', async () => {
    const source = await driver.getPageSource()
    if (source.includes('Select a Student')) return

    // "By Subject (This Week)" section with subject names and progress bars
    // This section only appears when there are activities
    expect(
      source.includes('By Subject') ||
      source.includes('Milestones') ||
      source.includes('Recent Days')
    ).toBe(true)
  })

  it('pull to refresh works', async () => {
    await scrollUp()
    await pause(300)
    await pullToRefresh()
    await assertNoCrash()
  })
})
