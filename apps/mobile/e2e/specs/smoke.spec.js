/**
 * E2E Smoke Test Suite
 *
 * Handles: Dev Launcher → Onboarding → Tab Navigation → More Menu Screens
 * Navigation uses deep links (exp+homeschool://) since XCUITest .click()
 * does not trigger Expo Router tab navigation.
 */
const fs = require('fs')
const { DEEP_LINK_SCHEME, ROUTE_MAP } = require('./helpers')

describe('Homeschool App E2E', () => {
  // Helper: tap element by accessibility label
  async function tap(label, timeoutMs = 8000) {
    const el = await $(`~${label}`)
    if (await el.isExisting()) {
      await el.click()
      return
    }
    const byText = await $(`//*[@label="${label}" or @name="${label}"]`)
    await byText.waitForExist({ timeout: timeoutMs })
    await byText.click()
  }

  // Helper: dismiss keyboard if visible
  async function hideKeyboard() {
    try {
      const keyboard = await $('//XCUIElementTypeKeyboard')
      if (await keyboard.isExisting()) {
        try {
          const returnKey = await $(`~return`)
          if (await returnKey.isExisting()) {
            await returnKey.click()
            await driver.pause(300)
            return
          }
        } catch { /* ignore */ }
        await driver.action('pointer')
          .move({ x: 200, y: 100 })
          .down()
          .up()
          .perform()
        await driver.pause(300)
      }
    } catch { /* no keyboard */ }
  }

  // Helper: dump page source for debugging
  async function dumpSource(filename) {
    const source = await driver.getPageSource()
    fs.writeFileSync(`/tmp/${filename}`, source, 'utf-8')
  }

  // Helper: navigate via deep link
  async function navigateTo(screenName) {
    const route = ROUTE_MAP[screenName]
    if (!route) throw new Error(`Unknown screen: ${screenName}`)
    await driver.url(`${DEEP_LINK_SCHEME}${route}`)
    await driver.pause(2000)
  }

  // ============= DEV LAUNCHER =============

  describe('App Launch', () => {
    it('should connect to Metro if dev launcher is shown', async () => {
      // Restart app to clear any stale state (open modals, alerts, etc.)
      try {
        await driver.execute('mobile: terminateApp', { bundleId: 'com.scoblelife.homeschool' })
        await driver.pause(1000)
        await driver.execute('mobile: launchApp', { bundleId: 'com.scoblelife.homeschool' })
        await driver.pause(5000)
      } catch {
        await driver.pause(3000)
      }
      const devBuild = await $(`//*[contains(@label, "Development Build") or contains(@label, "DEVELOPMENT SERVERS")]`)
      if (await devBuild.isExisting()) {
        const metroBtn = await $(`~http://localhost:8081`)
        await metroBtn.waitForExist({ timeout: 5000 })
        await metroBtn.click()
        await driver.pause(15000)
      }
      await hideKeyboard()
    })
  })

  // ============= ONBOARDING =============

  describe('Onboarding Flow', () => {
    it('should show the welcome carousel or students page', async () => {
      const skipBtn = await $(`~Skip onboarding`)
      const continueBtn = await $(`~Continue to state selection`)
      const searchStates = await $(`~Search states`)
      const tabBar = await $('//XCUIElementTypeButton[contains(@label, "Today") and contains(@label, "tab")]')

      const onCarousel = await skipBtn.isExisting()
      const onStudents = await continueBtn.isExisting()
      const onStates = await searchStates.isExisting()
      const onMain = await tabBar.isExisting()

      expect(onCarousel || onStudents || onStates || onMain).toBe(true)

      if (onCarousel) {
        await skipBtn.click()
        await driver.pause(1500)
      }
    })

    it('should fill student info and continue', async () => {
      const continueBtn = await $(`~Continue to state selection`)
      if (!(await continueBtn.isExisting())) return

      await hideKeyboard()
      await driver.pause(300)

      const nameInput = await $('//XCUIElementTypeTextField')
      await nameInput.waitForExist({ timeout: 5000 })
      await nameInput.click()
      await driver.pause(500)
      await nameInput.clearValue()
      await driver.pause(200)
      await nameInput.addValue('Test')
      await driver.pause(500)

      await hideKeyboard()
      await driver.pause(500)

      await driver.execute('mobile: scroll', { direction: 'up' })
      await driver.pause(300)

      const gradeOptions = ['Pre-K', 'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade']
      let gradeSelected = false
      for (const grade of gradeOptions) {
        try {
          const gradeEl = await $(`~${grade}`)
          if (await gradeEl.isExisting()) {
            await gradeEl.click()
            gradeSelected = true
            break
          }
        } catch { /* try next */ }
      }

      if (!gradeSelected) {
        await driver.execute('mobile: scroll', { direction: 'right', element: await $('//XCUIElementTypeScrollView[2]') })
        await tap('3rd Grade', 3000)
      }

      await driver.pause(500)
      await tap('Continue to state selection')
      await driver.pause(3000)
    })

    it('should complete state selection', async () => {
      const searchStates = await $(`~Search states`)
      const isOnStatePage = await searchStates.isExisting()

      if (!isOnStatePage) {
        try {
          await searchStates.waitForExist({ timeout: 8000 })
        } catch {
          const tabBar = await $('//XCUIElementTypeButton[contains(@label, "Today") and contains(@label, "tab")]')
          if (await tabBar.isExisting()) return
          throw new Error('Not on state selection page and no tab bar')
        }
      }

      const searchInput = await $(`~Search states`)
      await searchInput.click()
      await driver.pause(500)
      await driver.execute('mobile: keys', { keys: ['N', 'e', 'v'] })
      await driver.pause(800)

      try {
        const keys = ['search', 'Search', 'return', 'Return', 'done', 'Done', 'go', 'Go']
        for (const key of keys) {
          const keyEl = await $(`~${key}`)
          if (await keyEl.isExisting()) {
            await keyEl.click()
            break
          }
        }
      } catch { /* ignore */ }
      await driver.pause(500)

      const nevada = await $(`//*[contains(@label, "Nevada")]`)
      await nevada.waitForExist({ timeout: 5000 })
      await nevada.click()
      await driver.pause(500)

      await driver.action('pointer')
        .move({ x: 200, y: 120 })
        .down()
        .up()
        .perform()
      await driver.pause(500)

      const finishBtn = await $(`~Finish Setup`)
      await finishBtn.waitForExist({ timeout: 5000 })
      const isVisible = await finishBtn.getAttribute('visible')
      if (isVisible === 'true') {
        await finishBtn.click()
      } else {
        const loc = await finishBtn.getLocation()
        const size = await finishBtn.getSize()
        await driver.execute('mobile: tap', {
          x: Math.round(loc.x + size.width / 2),
          y: Math.round(loc.y + size.height / 2),
        })
      }
      await driver.pause(8000)
    })

    it('should show the main tab bar', async () => {
      const todayTab = await $(`//XCUIElementTypeButton[contains(@label, "Today") and contains(@label, "tab")]`)
      await todayTab.waitForExist({ timeout: 30000 })
      expect(await todayTab.isExisting()).toBe(true)
      await dumpSource('smoke-main-app.xml')
    })
  })

  // ============= TAB NAVIGATION (via deep links) =============

  describe('Tab Navigation', () => {
    const tabs = ['Today', 'Log', 'Progress', 'More']
    for (const tab of tabs) {
      it(`${tab} tab loads`, async () => {
        await navigateTo(tab)
        const source = await driver.getPageSource()
        expect(source.includes('Failed to initialize')).toBe(false)
      })
    }
  })

  // ============= MORE MENU SCREENS (via deep links) =============

  describe('More Menu Screens', () => {
    const menuItems = [
      'Calendar',
      'Events & Field Trips',
      'Activities',
      'Library',
      'Milestones',
      'Weekly Planner',
      'Reports',
      'Sync',
      'Settings',
    ]

    for (const item of menuItems) {
      it(`${item} loads`, async () => {
        await navigateTo(item)
        const source = await driver.getPageSource()
        expect(source.includes('Failed to initialize')).toBe(false)
      })
    }
  })
})
