/**
 * Streak Tracking Hook
 *
 * Provides a wrapper around activity creation that also updates streak data.
 * Also handles checking for expired streaks on load.
 */

import { useEffect, useCallback } from 'react'
import { parseISO } from 'date-fns'
import { useStreakStore, type Badge } from './streakStore'
import type { Student } from '../../../../shared/types'

interface StreakTrackingResult {
  recordActivity: (studentId: string, dateCompleted?: string) => Badge | null
  checkStreaks: () => void
}

/**
 * Hook to track streaks when activities are logged
 */
export function useStreakTracking(students: Student[]): StreakTrackingResult {
  const recordActivityStreak = useStreakStore((state) => state.recordActivity)
  const checkAndUpdateStreak = useStreakStore((state) => state.checkAndUpdateStreak)

  // Check all student streaks on mount (to break any expired streaks)
  useEffect(() => {
    students.forEach((student) => {
      checkAndUpdateStreak(student.id)
    })
  }, [students, checkAndUpdateStreak])

  const recordActivity = useCallback(
    (studentId: string, dateCompleted?: string): Badge | null => {
      const date = dateCompleted ? parseISO(dateCompleted) : new Date()
      return recordActivityStreak(studentId, date)
    },
    [recordActivityStreak]
  )

  const checkStreaks = useCallback(() => {
    students.forEach((student) => {
      checkAndUpdateStreak(student.id)
    })
  }, [students, checkAndUpdateStreak])

  return { recordActivity, checkStreaks }
}
