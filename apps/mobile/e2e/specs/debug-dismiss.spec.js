const fs = require('fs')
describe('Debug - More Tab', () => {
  it('should check More tab contents', async () => {
    // Tap More tab
    const moreTab = await $(`//XCUIElementTypeButton[contains(@label, "More") and contains(@label, "tab")]`)
    if (await moreTab.isExisting()) {
      await moreTab.click()
      await driver.pause(2000)
    }

    const source = await driver.getPageSource()
    fs.writeFileSync('/tmp/appium-more-tab.xml', source, 'utf-8')

    // List all labels
    const allElements = await $$('//*[@label]')
    console.log(`Total elements with labels: ${allElements.length}`)
    for (const el of allElements) {
      const label = await el.getAttribute('label')
      const type = await el.getAttribute('type')
      const visible = await el.getAttribute('visible')
      if (label && visible === 'true' && !label.includes('scroll bar')) {
        console.log(`  [${type}] "${label}"`)
      }
    }
  })
})
