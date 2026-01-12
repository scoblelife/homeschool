/**
 * Streak Store
 *
 * Tracks daily logging streaks per student using Zustand.
 * A streak is maintained when at least one activity is logged per day.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format, parseISO, differenceInDays, startOfDay, isYesterday, isToday } from 'date-fns'

export interface StreakData {
  currentStreak: number
  longestStreak: number
  lastLoggedDate: string | null // YYYY-MM-DD format
  streakStartDate: string | null
  badges: Badge[]
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  earnedDate: string
  threshold: number
}

const BADGE_DEFINITIONS = [
  { id: '7-day', name: 'Week Warrior', description: '7-day streak', icon: '🏅', threshold: 7 },
  { id: '14-day', name: 'Consistent Learner', description: '14-day streak', icon: '🎖️', threshold: 14 },
  { id: '30-day', name: 'Month Master', description: '30-day streak', icon: '🏆', threshold: 30 },
  { id: '60-day', name: 'Two-Month Champion', description: '60-day streak', icon: '🌟', threshold: 60 },
  { id: '100-day', name: 'Century Scholar', description: '100-day streak', icon: '👑', threshold: 100 },
  { id: '365-day', name: 'Year-Long Legend', description: '365-day streak', icon: '💎', threshold: 365 },
]

interface StreakState {
  // Per-student streak data: studentId -> StreakData
  streaks: Record<string, StreakData>

  // Actions
  recordActivity: (studentId: string, date?: Date) => Badge | null
  getStreak: (studentId: string) => StreakData
  checkAndUpdateStreak: (studentId: string) => void
  resetStreak: (studentId: string) => void
}

// Immutable default - never modified, safe to return as reference
const EMPTY_BADGES: Badge[] = []
const DEFAULT_STREAK_DATA: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastLoggedDate: null,
  streakStartDate: null,
  badges: EMPTY_BADGES,
}

export const useStreakStore = create<StreakState>()(
  persist(
    (set, get) => ({
      streaks: {},

      recordActivity: (studentId: string, date: Date = new Date()): Badge | null => {
        const today = format(startOfDay(date), 'yyyy-MM-dd')
        const streaks = get().streaks
        const currentData = streaks[studentId] || { ...DEFAULT_STREAK_DATA }

        // If already logged today, no change
        if (currentData.lastLoggedDate === today) {
          return null
        }

        let newStreak = 1
        let streakStartDate = today

        if (currentData.lastLoggedDate) {
          const lastDate = parseISO(currentData.lastLoggedDate)
          const todayDate = parseISO(today)
          const daysDiff = differenceInDays(todayDate, lastDate)

          if (daysDiff === 1) {
            // Continue streak
            newStreak = currentData.currentStreak + 1
            streakStartDate = currentData.streakStartDate || today
          } else if (daysDiff === 0) {
            // Same day, keep current
            return null
          }
          // daysDiff > 1: streak broken, starts fresh
        }

        const newLongest = Math.max(newStreak, currentData.longestStreak)

        // Check for new badges
        let newBadge: Badge | null = null
        const existingBadgeIds = new Set(currentData.badges.map(b => b.id))

        for (const badgeDef of BADGE_DEFINITIONS) {
          if (newStreak >= badgeDef.threshold && !existingBadgeIds.has(badgeDef.id)) {
            newBadge = {
              ...badgeDef,
              earnedDate: today,
            }
            break // Only award one badge at a time
          }
        }

        const updatedData: StreakData = {
          currentStreak: newStreak,
          longestStreak: newLongest,
          lastLoggedDate: today,
          streakStartDate,
          badges: newBadge
            ? [...currentData.badges, newBadge]
            : currentData.badges,
        }

        set({
          streaks: {
            ...streaks,
            [studentId]: updatedData,
          },
        })

        return newBadge
      },

      getStreak: (studentId: string): StreakData => {
        const streaks = get().streaks
        // Return the frozen default to avoid creating new objects (prevents infinite loops)
        return streaks[studentId] || DEFAULT_STREAK_DATA
      },

      checkAndUpdateStreak: (studentId: string): void => {
        const streaks = get().streaks
        const currentData = streaks[studentId]

        if (!currentData || !currentData.lastLoggedDate) return

        const lastDate = parseISO(currentData.lastLoggedDate)
        const today = startOfDay(new Date())
        const daysDiff = differenceInDays(today, lastDate)

        // If more than 1 day has passed and not logged today, streak is broken
        if (daysDiff > 1) {
          set({
            streaks: {
              ...streaks,
              [studentId]: {
                ...currentData,
                currentStreak: 0,
                streakStartDate: null,
              },
            },
          })
        }
      },

      resetStreak: (studentId: string): void => {
        const streaks = get().streaks
        set({
          streaks: {
            ...streaks,
            [studentId]: { ...DEFAULT_STREAK_DATA },
          },
        })
      },
    }),
    {
      name: 'homeschool-streaks',
    }
  )
)

// Helper to determine if streak is "at risk" (not logged today yet)
export function isStreakAtRisk(streakData: StreakData): boolean {
  if (!streakData.lastLoggedDate || streakData.currentStreak === 0) return false
  const lastDate = parseISO(streakData.lastLoggedDate)
  return !isToday(lastDate) && isYesterday(lastDate)
}

// Helper to check if streak is active (logged today)
export function isStreakActive(streakData: StreakData): boolean {
  if (!streakData.lastLoggedDate) return false
  const lastDate = parseISO(streakData.lastLoggedDate)
  return isToday(lastDate)
}

// Helper to get streak status text
export function getStreakStatusText(streakData: StreakData): string {
  if (streakData.currentStreak === 0) {
    return 'Start your streak!'
  }
  if (isStreakActive(streakData)) {
    return `${streakData.currentStreak} day streak`
  }
  if (isStreakAtRisk(streakData)) {
    return `${streakData.currentStreak} day streak (log today!)`
  }
  return 'Streak broken'
}
