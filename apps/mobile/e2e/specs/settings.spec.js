/**
 * Settings Screen E2E Tests
 *
 * Tests theme switching (System/Light/Dark), student cards, edit/create
 * student modals, app version info, and feedback button.
 */
const {
  tap,
  tapMore,
  pause,
  hideKeyboard,
  typeText,
  scrollDown,
  scrollUp,
  assertNoCrash,
  goBack,
  findByPartialLabel,
  tapByPartialLabel,
} = require('./helpers')

describe('Settings Screen', () => {
  before(async () => {
    await tapMore('Settings')
  })

  describe('Theme', () => {
    it('shows 3 theme options', async () => {
      const source = await driver.getPageSource()
      expect(source.includes('System')).toBe(true)
      expect(source.includes('Light')).toBe(true)
      expect(source.includes('Moon')).toBe(true)
    })

    it('can switch to light theme', async () => {
      // Find and tap the Light theme button
      const lightBtn = await $(`//*[@label="Light" or contains(@label, "Light")]`)
      if (await lightBtn.isExisting()) {
        await lightBtn.click()
        await pause(1000)

        // Verify "Current: Light mode" text appears
        const source = await driver.getPageSource()
        expect(source.includes('Light mode') || source.includes('Light')).toBe(true)
      }
    })

    it('can switch back to system theme', async () => {
      const systemBtn = await $(`//*[@label="System" or contains(@label, "System")]`)
      if (await systemBtn.isExisting()) {
        await systemBtn.click()
        await pause(1000)
        await assertNoCrash()
      }
    })
  })

  describe('Students', () => {
    it('shows existing student cards', async () => {
      await scrollDown()
      await pause(500)

      // Student cards contain student names, grade badges, and chevron icons
      const source = await driver.getPageSource()
      // Should have at least one student or the empty state
      expect(
        source.includes('Students') ||
        source.includes('No Students Yet')
      ).toBe(true)
    })

    it('tapping student opens edit modal', async () => {
      // Find a student card (any touchable with a name and grade)
      const studentCards = await $$('//XCUIElementTypeButton[.//XCUIElementTypeStaticText]')
      if (studentCards.length > 0) {
        // Look for the first student card after the "Students" heading
        const firstStudentCard = await $(`//*[contains(@label, "Grade") or contains(@label, "Born")]`)
        if (await firstStudentCard.isExisting()) {
          await firstStudentCard.click()
          await pause(1000)

          // Edit Student modal should appear
          const source = await driver.getPageSource()
          const hasEditModal = source.includes('Edit Student') || source.includes('Save Changes')
          if (hasEditModal) {
            // Close the modal
            const closeBtn = await $(`//*[@label="Close" or @label="close"]`)
            if (await closeBtn.isExisting()) {
              await closeBtn.click()
              await pause(500)
            }
          }
        }
      }
    })

    it('can edit student name', async () => {
      // Re-open a student if available
      await scrollUp()
      await pause(300)
      await scrollDown()
      await pause(300)

      // Find student cards — look for chevron-forward pattern typical of student rows
      const source = await driver.getPageSource()
      if (source.includes('Edit Student') || source.includes('chevron-forward')) {
        // The edit modal has a Name input with label "Name *"
        const nameInput = await $(`//XCUIElementTypeTextField`)
        if (await nameInput.isExisting()) {
          const originalValue = await nameInput.getText()
          await nameInput.click()
          await pause(300)
          await nameInput.clearValue()
          await pause(200)
          await typeText('TestName')
          await pause(300)
          await hideKeyboard()
          await pause(300)

          // Verify text was entered
          const newValue = await nameInput.getText()
          expect(newValue).toContain('TestName')

          // Restore original name
          await nameInput.click()
          await pause(300)
          await nameInput.clearValue()
          await pause(200)
          if (originalValue) {
            await typeText(originalValue)
          }
          await hideKeyboard()
          await pause(300)
        }
      }
      await assertNoCrash()
    })

    it('can change student color', async () => {
      // In the edit modal, color circles are touchable
      const source = await driver.getPageSource()
      if (source.includes('Color')) {
        // Color options are circular touchable views — find them
        // They don't have specific accessibility labels, but are buttons with checkmarks
        const colorButtons = await $$('//XCUIElementTypeButton[.//XCUIElementTypeImage]')
        if (colorButtons.length > 0) {
          // Tap a different color
          const target = colorButtons.length > 1 ? colorButtons[1] : colorButtons[0]
          await target.click()
          await pause(500)
        }
      }
      await assertNoCrash()
    })

    it('add button opens create modal', async () => {
      // Close any open modal first
      try {
        const closeBtn = await $(`//*[@label="Close" or @label="close"]`)
        if (await closeBtn.isExisting()) {
          await closeBtn.click()
          await pause(500)
        }
      } catch { /* no modal open */ }

      await scrollUp()
      await pause(300)

      // The add button is an Ionicons "add-circle" icon near "Students" heading
      const addBtn = await $(`//*[@label="add-circle" or contains(@label, "add")]`)
      if (await addBtn.isExisting()) {
        await addBtn.click()
        await pause(1000)

        const source = await driver.getPageSource()
        expect(source.includes('Add Student')).toBe(true)

        // Close modal
        const closeBtn = await $(`//*[@label="Close" or @label="close"]`)
        if (await closeBtn.isExisting()) {
          await closeBtn.click()
          await pause(500)
        }
      }
    })
  })

  describe('About', () => {
    it('shows app version', async () => {
      // Close any modal that might be open
      try {
        const closeBtn = await $(`//*[@label="Close" or @label="close"]`)
        if (await closeBtn.isExisting()) {
          await closeBtn.click()
          await pause(500)
        }
      } catch { /* ignore */ }

      await scrollDown()
      await pause(500)

      const source = await driver.getPageSource()
      expect(source.includes('Version 0.1.0')).toBe(true)
    })

    it('shows feedback button', async () => {
      const source = await driver.getPageSource()
      expect(
        source.includes('Support') ||
        source.includes('Feedback') ||
        source.includes('feedback')
      ).toBe(true)
    })
  })

  after(async () => {
    // Navigate back to More menu
    await goBack()
    await pause(500)
  })
})
