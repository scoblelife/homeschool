/**
 * Shared E2E test helpers
 *
 * Reusable utilities for all spec files.
 * Navigation uses deep links (exp+homeschool://) since XCUITest .click()
 * does not trigger React Native / Expo Router tab navigation.
 */
const fs = require('fs')

// ---------------------------------------------------------------------------
// Deep link URL scheme (Expo dev build)
// ---------------------------------------------------------------------------
const DEEP_LINK_SCHEME = 'exp+homeschool://'

/** Map of display names to Expo Router route paths */
const ROUTE_MAP = {
  Today: '/(tabs)',
  Log: '/(tabs)/log',
  Progress: '/(tabs)/progress',
  More: '/(tabs)/more',
  Calendar: '/(tabs)/calendar',
  'Events & Field Trips': '/(tabs)/field-trips',
  Activities: '/(tabs)/activities',
  Library: '/(tabs)/library',
  Milestones: '/(tabs)/milestones',
  'Weekly Planner': '/(tabs)/planner',
  Reports: '/(tabs)/reports',
  Sync: '/(tabs)/sync',
  Settings: '/(tabs)/settings',
}

// ---------------------------------------------------------------------------
// Alert / modal cleanup
// ---------------------------------------------------------------------------

/** Dismiss any visible iOS alert by tapping the last button (usually OK/Cancel) */
async function dismissAlerts() {
  const maxAttempts = 3
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const alert = await $('//XCUIElementTypeAlert')
      if (!(await alert.isExisting())) return
      const buttons = await $$('//XCUIElementTypeAlert//XCUIElementTypeButton')
      if (buttons.length > 0) {
        for (const btn of buttons) {
          const label = await btn.getAttribute('label')
          if (label === 'OK') {
            await btn.click()
            await driver.pause(500)
            break
          }
        }
        const stillExists = await $('//XCUIElementTypeAlert')
        if (await stillExists.isExisting()) {
          await buttons[buttons.length - 1].click()
          await driver.pause(500)
        }
      }
    } catch { /* no alert */ }
  }
}

/** Dismiss app-level modals by navigating to Today (resets stale state) */
async function dismissModals() {
  // Deep link to Today resets any open modals since it forces a tab switch
  // which unmounts the previous screen's modal state
}

/** Clean up any blocking overlays — alerts, keyboard */
async function ensureCleanState() {
  await dismissAlerts()
  try { await hideKeyboard() } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Navigation via deep links
// ---------------------------------------------------------------------------

/** Navigate to a tab screen via deep link */
async function navigateTo(screenName) {
  const route = ROUTE_MAP[screenName]
  if (!route) throw new Error(`Unknown screen: ${screenName}. Available: ${Object.keys(ROUTE_MAP).join(', ')}`)
  await ensureCleanState()
  await driver.url(`${DEEP_LINK_SCHEME}${route}`)
  await driver.pause(2000)
}

/** Navigate to a visible tab (Today, Log, Progress, More) via deep link */
async function tapTab(tabName) {
  await navigateTo(tabName)
}

/** Navigate to a More menu screen via deep link (Calendar, Library, etc.) */
async function tapMore(menuItem) {
  await navigateTo(menuItem)
}

// ---------------------------------------------------------------------------
// Core interaction helpers
// ---------------------------------------------------------------------------

/** Tap element by accessibility label, with XPath fallback */
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

/** Navigate back (iOS) — deep link to previous screen or swipe */
async function goBack() {
  await ensureCleanState()
  const patterns = [
    '~Go back',
    '//*[@name="Back" or @label="Back"]',
    '//XCUIElementTypeNavigationBar//XCUIElementTypeButton[1]',
  ]
  for (const selector of patterns) {
    try {
      const el = await $(selector)
      if (await el.isExisting()) {
        await el.click()
        return
      }
    } catch { /* try next */ }
  }
  const { width, height } = await driver.getWindowRect()
  await driver
    .action('pointer')
    .move({ x: 5, y: Math.round(height / 2) })
    .down()
    .move({ x: Math.round(width / 2), y: Math.round(height / 2), duration: 300 })
    .up()
    .perform()
}

/** Dismiss keyboard if visible */
async function hideKeyboard() {
  try {
    const keyboard = await $('//XCUIElementTypeKeyboard')
    if (await keyboard.isExisting()) {
      try {
        const returnKey = await $('~return')
        if (await returnKey.isExisting()) {
          await returnKey.click()
          await driver.pause(300)
          return
        }
      } catch { /* ignore */ }
      await driver
        .action('pointer')
        .move({ x: 200, y: 100 })
        .down()
        .up()
        .perform()
      await driver.pause(300)
    }
  } catch { /* no keyboard */ }
}

/** Dump page source to /tmp for debugging */
async function dumpSource(filename) {
  const source = await driver.getPageSource()
  fs.writeFileSync(`/tmp/${filename}`, source, 'utf-8')
}

// ---------------------------------------------------------------------------
// Text and form helpers
// ---------------------------------------------------------------------------

/** Type text using iOS keyboard keys */
async function typeText(text) {
  const keys = text.split('')
  await driver.execute('mobile: keys', { keys })
}

/** Wait for an element with a given accessibility label to exist */
async function waitFor(label, timeout = 10000) {
  const el = await $(`~${label}`)
  await el.waitForExist({ timeout })
  return el
}

/** Assert that an element with the given label is visible */
async function assertVisible(label, timeout = 5000) {
  const el = await $(`~${label}`)
  await el.waitForExist({ timeout })
  const displayed = await el.isDisplayed()
  expect(displayed).toBe(true)
}

/** Assert that no element with the given label exists */
async function assertNotVisible(label) {
  const el = await $(`~${label}`)
  const exists = await el.isExisting()
  expect(exists).toBe(false)
}

/** Assert element's text attribute contains a value */
async function assertText(label, expectedText) {
  const el = await $(`~${label}`)
  await el.waitForExist({ timeout: 5000 })
  const text = await el.getText()
  expect(text).toContain(expectedText)
}

/** Scroll down on the current view */
async function scrollDown() {
  await driver.execute('mobile: scroll', { direction: 'down' })
}

/** Scroll up on the current view */
async function scrollUp() {
  await driver.execute('mobile: scroll', { direction: 'up' })
}

/** Find an input by label, clear it, type text, dismiss keyboard */
async function fillInput(label, text) {
  const el = await $(`~${label}`)
  await el.waitForExist({ timeout: 5000 })
  await el.click()
  await driver.pause(300)
  await el.clearValue()
  await driver.pause(200)
  await typeText(text)
  await driver.pause(300)
  await hideKeyboard()
  await driver.pause(300)
}

/** Fill a text field found by XPath */
async function fillInputByXPath(xpath, text) {
  const el = await $(xpath)
  await el.waitForExist({ timeout: 5000 })
  await el.click()
  await driver.pause(300)
  await el.clearValue()
  await driver.pause(200)
  await typeText(text)
  await driver.pause(300)
  await hideKeyboard()
  await driver.pause(300)
}

/** Tap a radio-style chip/button */
async function selectRadio(label) {
  await tap(label)
}

/** Pause for ms */
async function pause(ms) {
  await driver.pause(ms)
}

/** Check that the page source does NOT contain an error string */
async function assertNoCrash() {
  const source = await driver.getPageSource()
  expect(source.includes('Failed to initialize')).toBe(false)
}

/** Pull to refresh — swipe down from top quarter of the screen */
async function pullToRefresh() {
  const { width, height } = await driver.getWindowRect()
  const centerX = Math.round(width / 2)
  await driver
    .action('pointer')
    .move({ x: centerX, y: Math.round(height * 0.25) })
    .down()
    .move({ x: centerX, y: Math.round(height * 0.75), duration: 500 })
    .up()
    .perform()
  await driver.pause(2000)
}

/** Find element by label containing partial text */
async function findByPartialLabel(partialText, timeout = 5000) {
  const el = await $(`//*[contains(@label, "${partialText}")]`)
  await el.waitForExist({ timeout })
  return el
}

/** Tap element by partial label match */
async function tapByPartialLabel(partialText, timeout = 5000) {
  const el = await findByPartialLabel(partialText, timeout)
  await el.click()
}

module.exports = {
  DEEP_LINK_SCHEME,
  ROUTE_MAP,
  navigateTo,
  tap,
  tapTab,
  tapMore,
  goBack,
  hideKeyboard,
  dumpSource,
  dismissAlerts,
  dismissModals,
  ensureCleanState,
  typeText,
  waitFor,
  assertVisible,
  assertNotVisible,
  assertText,
  scrollDown,
  scrollUp,
  fillInput,
  fillInputByXPath,
  selectRadio,
  pause,
  assertNoCrash,
  pullToRefresh,
  findByPartialLabel,
  tapByPartialLabel,
}
