/**
 * Achievement Store
 *
 * Tracks cumulative achievements and unlocked milestones.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'hours' | 'activities' | 'books' | 'streak' | 'special'
  threshold: number
  unlockedAt?: string // ISO date when unlocked
}

export interface AchievementProgress {
  category: Achievement['category']
  current: number
  nextMilestone: Achievement | null
}

// Achievement definitions
export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'unlockedAt'>[] = [
  // Hours logged
  { id: 'hours-10', name: 'Getting Started', description: '10 hours of learning', icon: '📚', category: 'hours', threshold: 10 },
  { id: 'hours-50', name: 'Dedicated Learner', description: '50 hours of learning', icon: '📖', category: 'hours', threshold: 50 },
  { id: 'hours-100', name: 'Century Scholar', description: '100 hours of learning', icon: '🎓', category: 'hours', threshold: 100 },
  { id: 'hours-250', name: 'Knowledge Seeker', description: '250 hours of learning', icon: '🏅', category: 'hours', threshold: 250 },
  { id: 'hours-500', name: 'Master Student', description: '500 hours of learning', icon: '🏆', category: 'hours', threshold: 500 },
  { id: 'hours-1000', name: 'Legendary Scholar', description: '1000 hours of learning', icon: '👑', category: 'hours', threshold: 1000 },

  // Activities completed
  { id: 'activities-10', name: 'First Steps', description: '10 activities completed', icon: '✏️', category: 'activities', threshold: 10 },
  { id: 'activities-50', name: 'Busy Bee', description: '50 activities completed', icon: '🐝', category: 'activities', threshold: 50 },
  { id: 'activities-100', name: 'Centurion', description: '100 activities completed', icon: '💯', category: 'activities', threshold: 100 },
  { id: 'activities-500', name: 'Super Achiever', description: '500 activities completed', icon: '⭐', category: 'activities', threshold: 500 },
  { id: 'activities-1000', name: 'Unstoppable', description: '1000 activities completed', icon: '🚀', category: 'activities', threshold: 1000 },

  // Books read
  { id: 'books-5', name: 'Bookworm', description: '5 books finished', icon: '📕', category: 'books', threshold: 5 },
  { id: 'books-10', name: 'Book Lover', description: '10 books finished', icon: '📗', category: 'books', threshold: 10 },
  { id: 'books-25', name: 'Avid Reader', description: '25 books finished', icon: '📘', category: 'books', threshold: 25 },
  { id: 'books-50', name: 'Literary Hero', description: '50 books finished', icon: '📙', category: 'books', threshold: 50 },
  { id: 'books-100', name: 'Library Legend', description: '100 books finished', icon: '📚', category: 'books', threshold: 100 },
]

interface AchievementState {
  // Per-student unlocked achievements: studentId -> Achievement[]
  unlockedAchievements: Record<string, Achievement[]>

  // Recently unlocked (for showing confetti)
  recentlyUnlocked: Achievement | null

  // Actions
  checkAndUnlock: (studentId: string, category: Achievement['category'], currentValue: number) => Achievement | null
  getUnlocked: (studentId: string) => Achievement[]
  getProgress: (studentId: string, category: Achievement['category'], currentValue: number) => AchievementProgress
  clearRecentlyUnlocked: () => void
}

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      unlockedAchievements: {},
      recentlyUnlocked: null,

      checkAndUnlock: (studentId: string, category: Achievement['category'], currentValue: number): Achievement | null => {
        const unlocked = get().unlockedAchievements[studentId] || []
        const unlockedIds = new Set(unlocked.map((a) => a.id))

        // Find achievements in this category that should be unlocked
        const eligibleAchievements = ACHIEVEMENT_DEFINITIONS.filter(
          (a) => a.category === category && a.threshold <= currentValue && !unlockedIds.has(a.id)
        )

        if (eligibleAchievements.length === 0) return null

        // Unlock the highest threshold achievement
        const toUnlock = eligibleAchievements.reduce((highest, current) =>
          current.threshold > highest.threshold ? current : highest
        )

        const newAchievement: Achievement = {
          ...toUnlock,
          unlockedAt: new Date().toISOString(),
        }

        // Also unlock any lower achievements they missed
        const allToUnlock: Achievement[] = eligibleAchievements.map((a) => ({
          ...a,
          unlockedAt: new Date().toISOString(),
        }))

        set({
          unlockedAchievements: {
            ...get().unlockedAchievements,
            [studentId]: [...unlocked, ...allToUnlock],
          },
          recentlyUnlocked: newAchievement,
        })

        return newAchievement
      },

      getUnlocked: (studentId: string): Achievement[] => {
        return get().unlockedAchievements[studentId] || []
      },

      getProgress: (studentId: string, category: Achievement['category'], currentValue: number): AchievementProgress => {
        const unlocked = get().unlockedAchievements[studentId] || []
        const unlockedIds = new Set(unlocked.map((a) => a.id))

        // Find next milestone in category
        const nextMilestone = ACHIEVEMENT_DEFINITIONS
          .filter((a) => a.category === category && !unlockedIds.has(a.id))
          .sort((a, b) => a.threshold - b.threshold)[0] || null

        return {
          category,
          current: currentValue,
          nextMilestone: nextMilestone ? { ...nextMilestone } : null,
        }
      },

      clearRecentlyUnlocked: () => {
        set({ recentlyUnlocked: null })
      },
    }),
    {
      name: 'homeschool-achievements',
    }
  )
)
