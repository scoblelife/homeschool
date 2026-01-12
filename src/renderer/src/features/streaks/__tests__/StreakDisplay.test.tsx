/**
 * StreakDisplay Component Tests
 *
 * These tests verify the StreakDisplay component renders correctly
 * and doesn't cause infinite re-renders.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { StreakDisplay } from '../StreakDisplay'
import { useStreakStore } from '../streakStore'

// Mock window.api
beforeAll(() => {
  Object.defineProperty(window, 'api', {
    value: {},
    writable: true,
  })
})

// Mock the store
vi.mock('../streakStore', async () => {
  const actual = await vi.importActual('../streakStore')
  return {
    ...actual,
    useStreakStore: vi.fn(),
  }
})

describe('StreakDisplay', () => {
  const mockUseStreakStore = vi.mocked(useStreakStore)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing for a student with no streak data', () => {
    // Simulate a student with no streak history (the bug case)
    mockUseStreakStore.mockImplementation((selector) => {
      const state = {
        streaks: {},
        recordActivity: vi.fn(),
        getStreak: vi.fn(),
        checkAndUpdateStreak: vi.fn(),
        resetStreak: vi.fn(),
      }
      return selector(state)
    })

    // This would cause an infinite loop if getStreak returns a new object each time
    const { container } = render(
      <StreakDisplay
        studentId="test-student-1"
        studentName="Test Student"
        studentColor="fuchsia"
      />
    )

    expect(container).toBeDefined()
  })

  it('renders with zero streak when student has no history', () => {
    mockUseStreakStore.mockImplementation((selector) => {
      const state = {
        streaks: {},
        recordActivity: vi.fn(),
        getStreak: vi.fn(),
        checkAndUpdateStreak: vi.fn(),
        resetStreak: vi.fn(),
      }
      return selector(state)
    })

    render(
      <StreakDisplay
        studentId="test-student-1"
        studentName="Test Student"
      />
    )

    // Should show 0 streak
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('displays current streak when student has streak data', () => {
    mockUseStreakStore.mockImplementation((selector) => {
      const state = {
        streaks: {
          'test-student-1': {
            currentStreak: 7,
            longestStreak: 14,
            lastLoggedDate: new Date().toISOString().split('T')[0],
            streakStartDate: '2024-01-01',
            badges: [],
          },
        },
        recordActivity: vi.fn(),
        getStreak: vi.fn(),
        checkAndUpdateStreak: vi.fn(),
        resetStreak: vi.fn(),
      }
      return selector(state)
    })

    render(
      <StreakDisplay
        studentId="test-student-1"
        studentName="Test Student"
      />
    )

    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('displays badges when student has earned them', () => {
    mockUseStreakStore.mockImplementation((selector) => {
      const state = {
        streaks: {
          'test-student-1': {
            currentStreak: 7,
            longestStreak: 7,
            lastLoggedDate: new Date().toISOString().split('T')[0],
            streakStartDate: '2024-01-01',
            badges: [
              {
                id: '7-day',
                name: 'Week Warrior',
                description: '7-day streak',
                icon: '🏅',
                earnedDate: '2024-01-07',
                threshold: 7,
              },
            ],
          },
        },
        recordActivity: vi.fn(),
        getStreak: vi.fn(),
        checkAndUpdateStreak: vi.fn(),
        resetStreak: vi.fn(),
      }
      return selector(state)
    })

    render(
      <StreakDisplay
        studentId="test-student-1"
        studentName="Test Student"
      />
    )

    expect(screen.getByText(/Week Warrior/)).toBeInTheDocument()
  })

  it('compact mode renders minimal UI', () => {
    mockUseStreakStore.mockImplementation((selector) => {
      const state = {
        streaks: {
          'test-student-1': {
            currentStreak: 5,
            longestStreak: 5,
            lastLoggedDate: new Date().toISOString().split('T')[0],
            streakStartDate: '2024-01-01',
            badges: [],
          },
        },
        recordActivity: vi.fn(),
        getStreak: vi.fn(),
        checkAndUpdateStreak: vi.fn(),
        resetStreak: vi.fn(),
      }
      return selector(state)
    })

    render(
      <StreakDisplay
        studentId="test-student-1"
        studentName="Test Student"
        compact
      />
    )

    // In compact mode, should not show "Best Streak" text
    expect(screen.queryByText('Best Streak')).not.toBeInTheDocument()
  })

  it('does not cause infinite re-renders with default streak data', async () => {
    // This test specifically checks for the infinite loop bug
    // by counting renders
    let renderCount = 0

    mockUseStreakStore.mockImplementation((selector) => {
      renderCount++
      const state = {
        streaks: {},
        recordActivity: vi.fn(),
        getStreak: vi.fn(),
        checkAndUpdateStreak: vi.fn(),
        resetStreak: vi.fn(),
      }
      return selector(state)
    })

    render(
      <StreakDisplay
        studentId="new-student"
        studentName="New Student"
      />
    )

    // Wait a bit to see if more renders happen
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    // Should not have excessive renders (the bug caused 100+ renders)
    expect(renderCount).toBeLessThan(10)
  })
})
