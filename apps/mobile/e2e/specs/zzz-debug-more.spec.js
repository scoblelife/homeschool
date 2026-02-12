const fs = require('fs')

describe('Debug Deep Link Navigation', () => {
  it('navigate directly to hidden tabs via deep link', async () => {
    await driver.pause(2000)

    const routes = [
      { name: 'Calendar', path: '/(tabs)/calendar' },
      { name: 'Library', path: '/(tabs)/library' },
      { name: 'Settings', path: '/(tabs)/settings' },
      { name: 'Log', path: '/(tabs)/log' },
      { name: 'Today', path: '/(tabs)' },
    ]

    for (const route of routes) {
      console.log(`\n--- Deep link to ${route.name} ---`)
      await driver.url(`exp+homeschool://${route.path}`)
      await driver.pause(2000)
      const source = await driver.getPageSource()
      const labels = (source.match(/label="[^"]*"/g) || [])
        .filter(l => !l.includes('scroll bar') && !l.includes('Homeschool') && !l.includes('tab,'))
        .slice(0, 10)
      labels.forEach(l => console.log('  ', l))
    }
  })

  it('click More menu items after deep link', async () => {
    // Navigate to More screen
    await driver.url('exp+homeschool:///(tabs)/more')
    await driver.pause(2000)

    // Try clicking Calendar menu item
    const calBtn = await $(`//*[starts-with(@label, "Calendar:")]`)
    console.log('Calendar button exists:', await calBtn.isExisting())
    if (await calBtn.isExisting()) {
      await calBtn.click()
      await driver.pause(2000)
      const source = await driver.getPageSource()
      const hasCalendar = source.includes('Previous month') || source.includes('Sun') || source.includes('February')
      console.log('After clicking Calendar - navigated:', hasCalendar)
      const labels = (source.match(/label="[^"]*"/g) || [])
        .filter(l => !l.includes('scroll bar') && !l.includes('Homeschool') && !l.includes('tab,'))
        .slice(0, 10)
      labels.forEach(l => console.log('  ', l))
    }
  })
})
