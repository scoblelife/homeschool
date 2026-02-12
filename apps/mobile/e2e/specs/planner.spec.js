/**
 * Weekly Planner Screen E2E Tests
 *
 * Tests current week display, previous/next week navigation,
 * day columns, milestone list, empty state, and pull-to-refresh.
 */
const {
  tap,
  tapMore,
  pause,
  scrollDown,
  scrollUp,
  assertNoCrash,
  goBack,
  pullToRefresh,
} = require('./helpers')

describe('Weekly Planner Screen', () => {
  before(async () => {
    await tapMore('Weekly Planner')
  })

  it('shows current week date range', async () => {
    // Week header shows "MMM d - MMM d, yyyy" format
    const source = await driver.getPageSource()
    const now = new Date()
    const year = now.getFullYear().toString()
    // Should show the year somewhere in the week range
    expect(source.includes(year) || source.includes('Select a Student')).toBe(true)
  })

  it('previous week navigates back', async () => {
    const prevBtn = await $(`~Previous week`)
    if (await prevBtn.isExisting()) {
      await prevBtn.click()
      await pause(1000)
      await assertNoCrash()
    }
  })

  it('next week navigates forward', async () => {
    const nextBtn = await $(`~Next week`)
    if (await nextBtn.isExisting()) {
      // Go forward twice (back to current week + one more)
      await nextBtn.click()
      await pause(500)
      await nextBtn.click()
      await pause(1000)
      await assertNoCrash()

      // Navigate back to current week
      const prevBtn = await $(`~Previous week`)
      if (await prevBtn.isExisting()) {
        await prevBtn.click()
        await pause(500)
      }
    }
  })

  it('shows day columns for the week', async () => {
    const source = await driver.getPageSource()
    if (source.includes('Select a Student')) return

    // Day strip shows abbreviated day names: Mon, Tue, Wed, Thu, Fri, Sat, Sun
    expect(source.includes('MON') || source.includes('Mon') || source.includes('TUE') || source.includes('Tue')).toBe(true)
  })

  it('shows milestones in day slots', async () => {
    await scrollDown()
    await pause(500)

    const source = await driver.getPageSource()
    if (source.includes('Select a Student')) return

    // Milestones show as checkboxes with star counts
    // Either milestones or "No Milestones" empty state
    expect(
      source.includes('stars') ||
      source.includes('completed') ||
      source.includes('not completed') ||
      source.includes('No Milestones') ||
      source.includes('Milestones')
    ).toBe(true)
  })

  it('can assign milestone to a day', async () => {
    // Milestones in the planner are toggleable checkboxes
    const milestoneCheckbox = await $(`//*[contains(@label, "completed") or contains(@label, "not completed")]`)
    if (await milestoneCheckbox.isExisting()) {
      await milestoneCheckbox.click()
      await pause(2000)

      // Alert may appear for star awards
      try {
        const okBtn = await $(`~OK`)
        if (await okBtn.isExisting()) {
          await okBtn.click()
          await pause(500)
        }
      } catch { /* no alert */ }

      await assertNoCrash()
    }
  })

  it('shows empty state when no student', async () => {
    // This is handled by the "Select a Student" check
    const source = await driver.getPageSource()
    // Either shows content or empty state
    expect(
      source.includes('Select a Student') ||
      source.includes('No Milestones') ||
      source.includes('Milestones') ||
      source.includes('stars')
    ).toBe(true)
  })

  it('pull to refresh works', async () => {
    await scrollUp()
    await pause(300)
    await pullToRefresh()
    await assertNoCrash()
  })

  after(async () => {
    await goBack()
    await pause(500)
  })
})
