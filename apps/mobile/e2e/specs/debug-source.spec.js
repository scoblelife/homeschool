/**
 * Debug: dump page source to understand element hierarchy
 */
describe('Debug - Page Source', () => {
  it('should dump current screen source', async () => {
    // Wait for app to be ready
    await driver.pause(3000)

    const source = await driver.getPageSource()
    // Write to file for inspection
    const fs = require('fs')
    fs.writeFileSync('/tmp/appium-page-source.xml', source)
    console.log('Page source written to /tmp/appium-page-source.xml')

    // Print all visible labeled elements
    const allElements = await $$('//*[@label]')
    console.log(`\nFound ${allElements.length} elements with labels`)
    for (const el of allElements.slice(0, 50)) {
      try {
        const label = await el.getAttribute('label')
        const type = await el.getAttribute('type')
        const visible = await el.getAttribute('visible')
        if (visible === 'true' && label && label.length < 200) {
          console.log(`  [${type}] "${label}"`)
        }
      } catch { /* skip */ }
    }

    const tabs = await $$('//XCUIElementTypeTabBar//XCUIElementTypeButton')
    console.log(`\nFound ${tabs.length} tab bar buttons:`)
    for (const tab of tabs) {
      const label = await tab.getAttribute('label')
      console.log(`  Tab: "${label}"`)
    }
  })
})
