/**
 * Achievement Card Component
 *
 * Displays unlocked achievements and progress towards next milestones.
 */

import { useState, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import { format, parseISO } from 'date-fns'
import {
  useAchievementStore,
  ACHIEVEMENT_DEFINITIONS,
  type Achievement,
  type AchievementProgress,
} from './achievementStore'
import { Confetti } from './Confetti'

interface AchievementCardProps {
  studentId: string
  studentName: string
}

export function AchievementCard({ studentId, studentName }: AchievementCardProps): JSX.Element {
  const [showModal, setShowModal] = useState(false)
  const [stats, setStats] = useState<{ totalHours: number; totalActivities: number; booksFinished: number }>({
    totalHours: 0,
    totalActivities: 0,
    booksFinished: 0,
  })

  const getUnlocked = useAchievementStore((state) => state.getUnlocked)
  const checkAndUnlock = useAchievementStore((state) => state.checkAndUnlock)
  const recentlyUnlocked = useAchievementStore((state) => state.recentlyUnlocked)
  const clearRecentlyUnlocked = useAchievementStore((state) => state.clearRecentlyUnlocked)

  const unlocked = getUnlocked(studentId)

  // Load stats and check for new achievements
  useEffect(() => {
    loadStats()
  }, [studentId])

  const loadStats = async () => {
    // Get all-time activity totals
    const activities = await window.api.getActivities({ studentId })
    const totalMinutes = activities.reduce((sum, a) => sum + (a.durationMinutes || 0), 0)
    const totalHours = Math.floor(totalMinutes / 60)
    const totalActivities = activities.length

    // Get finished books
    const booksWithProgress = await window.api.getBooksWithProgress(studentId)
    const booksFinished = booksWithProgress.filter(
      (b) => b.studentProgress?.status === 'finished'
    ).length

    setStats({ totalHours, totalActivities, booksFinished })

    // Check for new achievements
    checkAndUnlock(studentId, 'hours', totalHours)
    checkAndUnlock(studentId, 'activities', totalActivities)
    checkAndUnlock(studentId, 'books', booksFinished)
  }

  // Get recent achievements (last 3)
  const recentAchievements = [...unlocked]
    .sort((a, b) => {
      if (!a.unlockedAt || !b.unlockedAt) return 0
      return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime()
    })
    .slice(0, 3)

  return (
    <>
      <Confetti
        active={!!recentlyUnlocked}
        onComplete={clearRecentlyUnlocked}
      />

      {/* Achievement unlock notification */}
      {recentlyUnlocked && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 animate-bounce">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-4 rounded-xl shadow-xl">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{recentlyUnlocked.icon}</span>
              <div>
                <div className="font-bold">Achievement Unlocked!</div>
                <div className="text-sm opacity-90">{recentlyUnlocked.name}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Achievements</h3>
          <button
            onClick={() => setShowModal(true)}
            className="text-sm text-fuchsia-600 hover:text-fuchsia-800 dark:text-fuchsia-400 dark:hover:text-fuchsia-300"
          >
            View All ({unlocked.length}/{ACHIEVEMENT_DEFINITIONS.length})
          </button>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalHours}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Hours</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalActivities}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Activities</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.booksFinished}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Books</div>
          </div>
        </div>

        {/* Recent achievements */}
        {recentAchievements.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {recentAchievements.map((achievement) => (
              <span
                key={achievement.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full text-sm"
                title={achievement.description}
              >
                {achievement.icon} {achievement.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">Keep learning to unlock achievements!</p>
        )}
      </div>

      <AchievementModal
        open={showModal}
        onClose={() => setShowModal(false)}
        studentName={studentName}
        unlocked={unlocked}
        stats={stats}
      />
    </>
  )
}

interface AchievementModalProps {
  open: boolean
  onClose: () => void
  studentName: string
  unlocked: Achievement[]
  stats: { totalHours: number; totalActivities: number; booksFinished: number }
}

function AchievementModal({
  open,
  onClose,
  studentName,
  unlocked,
  stats,
}: AchievementModalProps): JSX.Element {
  const unlockedIds = new Set(unlocked.map((a) => a.id))
  const unlockedMap = new Map(unlocked.map((a) => [a.id, a]))

  // Group by category
  const categories = [
    { id: 'hours', name: 'Learning Hours', current: stats.totalHours },
    { id: 'activities', name: 'Activities', current: stats.totalActivities },
    { id: 'books', name: 'Books Read', current: stats.booksFinished },
  ] as const

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
          <div className="p-4 border-b dark:border-gray-700">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
              {studentName}'s Achievements
            </Dialog.Title>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {unlocked.length} of {ACHIEVEMENT_DEFINITIONS.length} unlocked
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {categories.map((category) => {
              const categoryAchievements = ACHIEVEMENT_DEFINITIONS.filter(
                (a) => a.category === category.id
              )

              return (
                <div key={category.id}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-700 dark:text-gray-200">{category.name}</h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Current: {category.current}</span>
                  </div>

                  <div className="space-y-2">
                    {categoryAchievements.map((achievement) => {
                      const isUnlocked = unlockedIds.has(achievement.id)
                      const unlockedData = unlockedMap.get(achievement.id)
                      const progress = isUnlocked
                        ? 100
                        : Math.min((category.current / achievement.threshold) * 100, 99)

                      return (
                        <div
                          key={achievement.id}
                          className={`flex items-center gap-3 p-3 rounded-lg ${
                            isUnlocked
                              ? 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 border border-amber-200 dark:border-amber-800'
                              : 'bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600'
                          }`}
                        >
                          <span className={`text-2xl ${isUnlocked ? '' : 'grayscale opacity-40'}`}>
                            {achievement.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div
                              className={`font-medium ${
                                isUnlocked ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
                              }`}
                            >
                              {achievement.name}
                            </div>
                            <div className={`text-xs ${isUnlocked ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                              {achievement.description}
                            </div>
                            {!isUnlocked && (
                              <div className="mt-1">
                                <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-fuchsia-400 rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                  {category.current} / {achievement.threshold}
                                </div>
                              </div>
                            )}
                            {isUnlocked && unlockedData?.unlockedAt && (
                              <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                                Unlocked {format(parseISO(unlockedData.unlockedAt), 'MMM d, yyyy')}
                              </div>
                            )}
                          </div>
                          {isUnlocked && (
                            <span className="text-green-500">✓</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="p-4 border-t dark:border-gray-700 flex justify-end">
            <button onClick={onClose} className="btn btn-secondary">
              Close
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}

// Shareable achievement card (for export/sharing)
export function ShareableAchievementCard({
  achievement,
  studentName,
}: {
  achievement: Achievement
  studentName: string
}): JSX.Element {
  return (
    <div className="w-80 bg-gradient-to-br from-purple-500 via-pink-500 to-amber-500 p-1 rounded-2xl">
      <div className="bg-white rounded-xl p-6 text-center">
        <div className="text-5xl mb-3">{achievement.icon}</div>
        <div className="text-xl font-bold text-gray-900">{achievement.name}</div>
        <div className="text-sm text-gray-600 mt-1">{achievement.description}</div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="text-sm text-gray-500">Unlocked by</div>
          <div className="font-semibold text-gray-900">{studentName}</div>
          {achievement.unlockedAt && (
            <div className="text-xs text-gray-400 mt-1">
              {format(parseISO(achievement.unlockedAt), 'MMMM d, yyyy')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
