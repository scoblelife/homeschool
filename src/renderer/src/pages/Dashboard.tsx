import { useEffect, useState, useCallback } from 'react'
import { format, parseISO, isFuture, isToday } from 'date-fns'
import { Link } from 'react-router-dom'
import { getStudentColor } from './Settings'
import QuickAdd from '../components/QuickAdd'
import { VoiceInput } from '../features/voiceInput'
import { RecurringActivities } from '../features/recurring'
import { Timer } from '../features/timer'
import { StreakDisplay, useStreakTracking } from '../features/streaks'
import { SubjectBalance } from '../features/balance'
import { AchievementCard } from '../features/celebrations'
import { ActivitySuggestions, LearningPatterns, CompliancePrediction } from '../features/aiInsights'
import { ErrorBoundary, WidgetErrorFallback } from '../components/ErrorBoundary'

// Helper to handle dates that might be Date objects or strings from DuckDB
const toDate = (date: string | Date): Date => {
  if (date instanceof Date) return date
  return parseISO(date)
}
import { useStore } from '../stores/useStore'
import { useMilestones } from '../hooks/useDatabase'
import type { Activity, Session, Milestone, FieldTrip, FamilyGoal } from '../../../shared/types'

export default function Dashboard(): JSX.Element {
  const { students, subjects, selectedStudentId, getStudentById, getSubjectById } = useStore()
  const { milestones } = useMilestones(selectedStudentId ?? undefined)
  const [todaySessions, setTodaySessions] = useState<Session[]>([])
  const [recentActivities, setRecentActivities] = useState<Activity[]>([])
  const [suggestedMilestones, setSuggestedMilestones] = useState<Milestone[]>([])
  const [upcomingFieldTrips, setUpcomingFieldTrips] = useState<FieldTrip[]>([])
  const [starTotals, setStarTotals] = useState<{ weeklyTotal: number; allTimeTotal: number } | null>(null)
  const [familyGoal, setFamilyGoal] = useState<FamilyGoal | null>(null)
  const [familyTotalStars, setFamilyTotalStars] = useState<number>(0)
  const [showCreateGoal, setShowCreateGoal] = useState(false)
  const [goalForm, setGoalForm] = useState({ title: '', starTarget: 100, rewardDescription: '' })

  // Streak tracking
  const { recordActivity } = useStreakTracking(students)

  const today = format(new Date(), 'yyyy-MM-dd')

  const loadDashboardData = useCallback(async (): Promise<void> => {
      const [sessions, activities, fieldTrips] = await Promise.all([
        window.api.getSessions({
          studentId: selectedStudentId || undefined,
          startDate: today,
          endDate: today
        }),
        window.api.getActivities({
          studentId: selectedStudentId || undefined
        }),
        window.api.getFieldTrips(
          selectedStudentId ? { studentId: selectedStudentId } : undefined
        )
      ])
      setTodaySessions(sessions)
      setRecentActivities(activities.slice(0, 5))

      // Filter to only upcoming/today field trips that are planned
      const upcoming = fieldTrips
        .filter((trip) => {
          const tripDate = toDate(trip.date)
          return (isFuture(tripDate) || isToday(tripDate)) && trip.status === 'planned'
        })
        .sort((a, b) => toDate(a.date).getTime() - toDate(b.date).getTime())
        .slice(0, 3)
      setUpcomingFieldTrips(upcoming)

      // Load suggested milestones and star totals if student selected
      if (selectedStudentId) {
        const [suggested, totals] = await Promise.all([
          window.api.getSuggestedMilestones(selectedStudentId, 5),
          window.api.getStudentStarTotals(selectedStudentId)
        ])
        setSuggestedMilestones(suggested)
        setStarTotals(totals)
      } else {
        setSuggestedMilestones([])
        setStarTotals(null)
      }
  }, [selectedStudentId, today])

  // Wrapper to handle activity creation + streak tracking
  const handleActivityCreated = useCallback(async () => {
    // First load fresh data
    await loadDashboardData()
    // Then update streaks for any today's activities
    const todayActivities = await window.api.getActivities({ startDate: today, endDate: today })
    todayActivities.forEach((activity) => {
      recordActivity(activity.studentId, activity.dateCompleted)
    })
  }, [loadDashboardData, today, recordActivity])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Load family goal data
  useEffect(() => {
    loadFamilyGoalData()
  }, [])

  const loadFamilyGoalData = async () => {
    const [goal, totalStars] = await Promise.all([
      window.api.getActiveFamilyGoal(),
      window.api.getFamilyTotalStars()
    ])
    setFamilyGoal(goal)
    setFamilyTotalStars(totalStars)
  }

  const handleCreateGoal = async () => {
    if (!goalForm.title || goalForm.starTarget <= 0) return
    await window.api.createFamilyGoal({
      title: goalForm.title,
      starTarget: goalForm.starTarget,
      rewardDescription: goalForm.rewardDescription || null,
      startDate: new Date().toISOString().split('T')[0],
      endDate: null
    })
    setShowCreateGoal(false)
    setGoalForm({ title: '', starTarget: 100, rewardDescription: '' })
    loadFamilyGoalData()
  }

  const handleAchieveGoal = async () => {
    if (!familyGoal) return
    await window.api.achieveFamilyGoal(familyGoal.id)
    loadFamilyGoalData()
  }

  const selectedStudent = selectedStudentId ? getStudentById(selectedStudentId) : null

  // Calculate milestone stats
  const milestoneStats = {
    total: milestones.length,
    completed: milestones.filter((m) => m.status === 'completed').length,
    inProgress: milestones.filter((m) => m.status === 'in_progress').length,
    percentage: milestones.length > 0
      ? Math.round((milestones.filter((m) => m.status === 'completed').length / milestones.length) * 100)
      : 0
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {selectedStudent ? `${selectedStudent.name}'s Dashboard` : 'Dashboard'}
          </h1>
          <p className="text-gray-500 mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        {/* Quick Actions */}
        <div className="flex gap-3">
          <Link to="/log" className="btn btn-secondary">
            + Log Activity
          </Link>
          <Link to="/weekly-planner" className="btn btn-primary">
            Weekly Plan
          </Link>
        </div>
      </div>

      {/* Recurring Activities - Today's Schedule */}
      <RecurringActivities onActivityCreated={handleActivityCreated} />

      {/* Session Timer */}
      <div className="mb-6">
        <Timer onSessionSaved={handleActivityCreated} />
      </div>

      {/* Milestone Progress (when student selected) */}
      {selectedStudent && milestones.length > 0 && (
        <div className="card mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Learning Progress</h2>
              <p className="text-sm text-gray-500">{milestoneStats.completed} of {milestoneStats.total} milestones completed</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-indigo-600">{milestoneStats.percentage}%</div>
            </div>
          </div>
          <div className="w-full bg-white/50 rounded-full h-3 mb-4">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${milestoneStats.percentage}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div className="bg-white/60 rounded-lg p-2">
              <div className="text-xl font-bold text-green-600">{milestoneStats.completed}</div>
              <div className="text-gray-500 text-xs">Completed</div>
            </div>
            <div className="bg-white/60 rounded-lg p-2">
              <div className="text-xl font-bold text-amber-600">{milestoneStats.inProgress}</div>
              <div className="text-gray-500 text-xs">In Progress</div>
            </div>
            <div className="bg-white/60 rounded-lg p-2">
              <div className="text-xl font-bold text-gray-400">{milestoneStats.total - milestoneStats.completed - milestoneStats.inProgress}</div>
              <div className="text-gray-500 text-xs">Not Started</div>
            </div>
          </div>
        </div>
      )}

      {/* Star Rewards (when student selected) */}
      {selectedStudent && starTotals && (
        <div className="card mb-6 bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center text-3xl">
                ⭐
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Skylight Stars</h2>
                <p className="text-sm text-gray-500">Track your reward progress</p>
              </div>
            </div>
            <div className="flex gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-yellow-600">{starTotals.weeklyTotal}</div>
                <div className="text-sm text-gray-500">This Week</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-amber-600">{starTotals.allTimeTotal}</div>
                <div className="text-sm text-gray-500">All Time</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Streak Display (when student selected) */}
      {selectedStudent && (
        <div className="mb-6">
          <ErrorBoundary fallback={<WidgetErrorFallback />}>
            <StreakDisplay
              studentId={selectedStudent.id}
              studentName={selectedStudent.name}
              studentColor={selectedStudent.color}
            />
          </ErrorBoundary>
        </div>
      )}

      {/* Subject Balance (when student selected) */}
      {selectedStudent && (
        <div className="mb-6">
          <ErrorBoundary fallback={<WidgetErrorFallback />}>
            <SubjectBalance
              studentId={selectedStudent.id}
              studentName={selectedStudent.name}
              subjects={subjects}
            />
          </ErrorBoundary>
        </div>
      )}

      {/* Achievements (when student selected) */}
      {selectedStudent && (
        <div className="mb-6">
          <ErrorBoundary fallback={<WidgetErrorFallback />}>
            <AchievementCard
              studentId={selectedStudent.id}
              studentName={selectedStudent.name}
            />
          </ErrorBoundary>
        </div>
      )}

      {/* AI Activity Suggestions (when student selected) */}
      {selectedStudent && (
        <div className="mb-6">
          <ErrorBoundary fallback={<WidgetErrorFallback />}>
            <ActivitySuggestions
              studentId={selectedStudent.id}
              studentName={selectedStudent.name}
              gradeLevel={selectedStudent.gradeLevel}
              subjects={subjects}
            />
          </ErrorBoundary>
        </div>
      )}

      {/* AI Learning Patterns (when student selected) */}
      {selectedStudent && (
        <div className="mb-6">
          <ErrorBoundary fallback={<WidgetErrorFallback />}>
            <LearningPatterns
              studentId={selectedStudent.id}
              studentName={selectedStudent.name}
              gradeLevel={selectedStudent.gradeLevel}
            />
          </ErrorBoundary>
        </div>
      )}

      {/* Compliance Prediction (when student selected) */}
      {selectedStudent && (
        <div className="mb-6">
          <ErrorBoundary fallback={<WidgetErrorFallback />}>
            <CompliancePrediction
              studentId={selectedStudent.id}
              studentName={selectedStudent.name}
            />
          </ErrorBoundary>
        </div>
      )}

      {/* Family Goal */}
      <div className="card mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <h2 className="text-lg font-semibold text-gray-900">Family Goal</h2>
          </div>
          {!familyGoal && !showCreateGoal && (
            <button onClick={() => setShowCreateGoal(true)} className="btn btn-secondary text-sm">
              + Set Goal
            </button>
          )}
        </div>

        {showCreateGoal && (
          <div className="bg-white rounded-lg p-4 border border-purple-200 mb-4">
            <div className="space-y-3">
              <div>
                <label className="label">Goal Title</label>
                <input
                  type="text"
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                  className="input"
                  placeholder="e.g., Pizza Night!"
                />
              </div>
              <div>
                <label className="label">Star Target</label>
                <input
                  type="number"
                  value={goalForm.starTarget}
                  onChange={(e) => setGoalForm({ ...goalForm, starTarget: parseInt(e.target.value) || 0 })}
                  className="input"
                  placeholder="100"
                />
              </div>
              <div>
                <label className="label">Reward Description (optional)</label>
                <input
                  type="text"
                  value={goalForm.rewardDescription}
                  onChange={(e) => setGoalForm({ ...goalForm, rewardDescription: e.target.value })}
                  className="input"
                  placeholder="e.g., Order pizza from our favorite place!"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowCreateGoal(false)} className="btn btn-secondary text-sm">
                  Cancel
                </button>
                <button onClick={handleCreateGoal} className="btn btn-primary text-sm">
                  Create Goal
                </button>
              </div>
            </div>
          </div>
        )}

        {familyGoal ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-purple-800">{familyGoal.title}</div>
              <div className="text-sm text-purple-600">
                {familyTotalStars} / {familyGoal.starTarget} ⭐
              </div>
            </div>
            {familyGoal.rewardDescription && (
              <p className="text-sm text-gray-600 mb-3">{familyGoal.rewardDescription}</p>
            )}
            <div className="relative h-6 bg-white/50 rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, (familyTotalStars / familyGoal.starTarget) * 100)}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
                {Math.round((familyTotalStars / familyGoal.starTarget) * 100)}%
              </div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-sm text-purple-600">
                {Math.max(0, familyGoal.starTarget - familyTotalStars)} more stars to go!
              </span>
              {familyTotalStars >= familyGoal.starTarget && (
                <button onClick={handleAchieveGoal} className="btn btn-primary text-sm bg-purple-600 hover:bg-purple-700">
                  🎉 Claim Reward!
                </button>
              )}
            </div>
          </div>
        ) : !showCreateGoal && (
          <p className="text-gray-500 text-sm">
            Set a family goal to work together towards a shared reward!
          </p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl">
              📚
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Today's Sessions</div>
              <div className="text-2xl font-bold text-gray-900">{todaySessions.length}</div>
            </div>
          </div>
        </div>
        <div className="card hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xl">
              ✏️
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Recent Activities</div>
              <div className="text-2xl font-bold text-gray-900">{recentActivities.length}</div>
            </div>
          </div>
        </div>
        <div className="card hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-xl">
              🎯
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Subjects</div>
              <div className="text-2xl font-bold text-gray-900">{subjects.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Field Trips */}
      {upcomingFieldTrips.length > 0 && (
        <div className="card mb-8 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span>🚌</span> Upcoming Field Trips
            </h2>
            <Link to="/field-trips" className="text-sm text-amber-600 hover:text-amber-800">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingFieldTrips.map((trip) => {
              const tripDate = toDate(trip.date)
              const tripStudents = students.filter((s) => trip.studentIds.includes(s.id))
              const isTripToday = isToday(tripDate)
              return (
                <div
                  key={trip.id}
                  className={`p-4 rounded-lg ${
                    isTripToday ? 'bg-amber-100 ring-2 ring-amber-400' : 'bg-white/60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{trip.title}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        📍 {trip.location}
                      </div>
                      <div className="text-sm text-amber-700 mt-1 font-medium">
                        📅 {isTripToday ? 'Today!' : format(tripDate, 'EEEE, MMM d')}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {tripStudents.map((s) => (
                          <span
                            key={s.id}
                            className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700"
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Sessions */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Sessions</h2>
          {todaySessions.length === 0 ? (
            <p className="text-gray-500 text-sm">No sessions scheduled for today.</p>
          ) : (
            <ul className="space-y-3">
              {todaySessions.map((session) => {
                const student = getStudentById(session.studentId)
                const subject = getSubjectById(session.subjectId)
                return (
                  <li key={session.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        getStudentColor(student?.color || 'fuchsia').bg
                      }`}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{subject?.name}</div>
                      <div className="text-sm text-gray-500">
                        {student?.name}
                        {session.startTime && ` • ${session.startTime}`}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Recent Activities */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h2>
          {recentActivities.length === 0 ? (
            <p className="text-gray-500 text-sm">No activities recorded yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentActivities.map((activity) => {
                const student = getStudentById(activity.studentId)
                const subject = getSubjectById(activity.subjectId)
                return (
                  <li key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        getStudentColor(student?.color || 'fuchsia').bg
                      }`}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{activity.title}</div>
                      <div className="text-sm text-gray-500">
                        {subject?.name} • {activity.activityType.replace('_', ' ')}
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      {format(parseISO(activity.dateCompleted), 'MMM d')}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Focus This Week - Suggested Milestones */}
      {selectedStudent && suggestedMilestones.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Focus This Week</h2>
            <Link to="/weekly-planner" className="text-sm text-indigo-600 hover:text-indigo-800">
              View Full Plan →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestedMilestones.slice(0, 6).map((milestone) => {
              const subject = getSubjectById(milestone.subjectId)
              return (
                <div
                  key={milestone.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    milestone.status === 'in_progress'
                      ? 'bg-amber-50 border-l-amber-500'
                      : 'bg-white border-l-gray-300 border border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                      {subject?.name}
                    </span>
                    {milestone.status === 'in_progress' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">
                        In Progress
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 mt-2 text-sm">{milestone.title}</h3>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Students Overview (if no student selected) */}
      {!selectedStudentId && students.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Students</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {students.map((student) => {
              const gradeLabels: Record<string, string> = {
                'pre-k': 'Pre-K',
                '1st': '1st Grade',
                '2nd': '2nd Grade',
                '3rd': '3rd Grade',
                '4th': '4th Grade',
                '5th': '5th Grade'
              }
              return (
                <div
                  key={student.id}
                  className={`card border-l-4 hover:shadow-md transition-shadow ${
                    getStudentColor(student.color).border
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold ${
                        getStudentColor(student.color).bg
                      }`}
                    >
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{student.name}</div>
                      <div className="text-sm text-gray-500">
                        {gradeLabels[student.gradeLevel] || student.gradeLevel}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick Add FAB */}
      <QuickAdd onActivityCreated={handleActivityCreated} />

      {/* Voice Input FAB */}
      <VoiceInput onActivityCreated={handleActivityCreated} />
    </div>
  )
}
