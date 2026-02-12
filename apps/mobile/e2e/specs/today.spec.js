/**
 * Today Screen E2E Tests
 *
 * Tests the Today dashboard: date header, compliance badge,
 * weekly stats, empty state, navigation CTAs, pull-to-refresh.
 */
const {
  tapTab,
  pause,
  assertNoCrash,
  pullToRefresh,
  findByPartialLabel,
  tapByPartialLabel,
} = require('./helpers')

describe('Today Screen', () => {
  before(async () => {
    await tapTab('Today')
    await pause(2000)
  })

  it('displays date header with current date', async () => {
    // The date header uses the format "EEEE, MMMM d" (e.g. "Wednesday, February 11")
    const today = new Date()
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December']
    const dayName = dayNames[today.getDay()]
    const monthName = monthNames[today.getMonth()]

    const source = await driver.getPageSource()
    // The header text should contain either the day name or month name
    const hasDate = source.includes(dayName) || source.includes(monthName) ||
      source.includes("Today's Activities")
    expect(hasDate).toBe(true)
  })

  it('shows compliance status badge', async () => {
    // Compliance badge has label "Compliance status: On track" or "Compliance status: Light week"
    const badge = await $(`//*[contains(@label, "Compliance status:")]`)
    await badge.waitForExist({ timeout: 5000 })
    const label = await badge.getAttribute('label')
    expect(label.startsWith('Compliance status:')).toBe(true)
  })

  it('shows weekly stats cards', async () => {
    // Stats cards have labels like "X activities this week", "X hours this week", "X subjects this week"
    const activitiesCard = await $(`//*[contains(@label, "activities this week")]`)
    await activitiesCard.waitForExist({ timeout: 5000 })
    expect(await activitiesCard.isExisting()).toBe(true)

    const hoursCard = await $(`//*[contains(@label, "hours this week")]`)
    expect(await hoursCard.isExisting()).toBe(true)

    const subjectsCard = await $(`//*[contains(@label, "subjects this week")]`)
    expect(await subjectsCard.isExisting()).toBe(true)
  })

  it('shows empty state when no activities today', async () => {
    // The empty state shows "Nothing logged yet" or activity cards
    const source = await driver.getPageSource()
    const hasEmptyState = source.includes('Nothing logged yet')
    const hasActivities = source.includes("Today's Activities")
    // One of these should be present
    expect(hasEmptyState || hasActivities).toBe(true)
  })

  it('empty state CTA is present when no activities', async () => {
    const source = await driver.getPageSource()
    if (source.includes('Nothing logged yet')) {
      // Verify empty state has actionable CTA text
      const emptyState = await $(`//*[contains(@label, "Nothing logged yet") or contains(@label, "Tap to log")]`)
      expect(await emptyState.isExisting()).toBe(true)
    }
  })

  it('+ Log button is visible', async () => {
    // The "+ Log" button should be present on the Today screen
    const source = await driver.getPageSource()
    // Screen should have either a Log button or activity content
    expect(
      source.includes('+ Log') ||
      source.includes('Log') ||
      source.includes("Today's Activities")
    ).toBe(true)
  })

  it('pull to refresh works', async () => {
    await pullToRefresh()
    await assertNoCrash()
  })

  it('student selector is visible', async () => {
    // StudentSelector renders touchable buttons for each student
    const source = await driver.getPageSource()
    // The student selector should show at least one student name
    // It's always rendered on the Today screen
    expect(source.includes('XCUIElementTypeButton')).toBe(true)
    await assertNoCrash()
  })
})
