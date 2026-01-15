import { useState, useEffect } from 'react'
import { format, parseISO, subDays, startOfMonth } from 'date-fns'
import { useStore } from '../stores/useStore'
import { PortfolioExport } from '../features/portfolio'
import type { ActivitySummary, DailySummary } from '../../../shared/types'

export default function Reports(): JSX.Element {
  const { students, selectedStudentId, getSelectedStudent } = useStore()
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  })
  const [activitySummary, setActivitySummary] = useState<ActivitySummary[]>([])
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const selectedStudent = getSelectedStudent()

  useEffect(() => {
    async function loadReports(): Promise<void> {
      if (!selectedStudentId) {
        setActivitySummary([])
        setDailySummaries([])
        return
      }

      setIsLoading(true)
      try {
        const [summary, daily] = await Promise.all([
          window.api.getActivitySummary(selectedStudentId, dateRange.startDate, dateRange.endDate),
          window.api.getDailySummaries(selectedStudentId, dateRange.startDate, dateRange.endDate)
        ])
        setActivitySummary(summary)
        setDailySummaries(daily)
      } finally {
        setIsLoading(false)
      }
    }
    loadReports()
  }, [selectedStudentId, dateRange])

  const totalActivities = activitySummary.reduce((sum, s) => sum + s.totalActivities, 0)
  const totalMinutes = activitySummary.reduce((sum, s) => sum + s.totalMinutes, 0)
  const totalHours = Math.round(totalMinutes / 60 * 10) / 10

  const quickRanges = [
    { label: 'This Week', days: 7 },
    { label: 'This Month', days: 30 },
    { label: 'This Quarter', days: 90 },
    { label: 'This Year', days: 365 }
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
      </div>

      {!selectedStudentId ? (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Select a student from the sidebar to view reports.</p>
        </div>
      ) : (
        <>
          {/* Date Range Selector */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-8">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">From:</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="w-auto border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">To:</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="w-auto border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                />
              </div>
              <div className="flex gap-2 ml-auto">
                {quickRanges.map((range) => (
                  <button
                    key={range.label}
                    onClick={() =>
                      setDateRange({
                        startDate: format(subDays(new Date(), range.days), 'yyyy-MM-dd'),
                        endDate: format(new Date(), 'yyyy-MM-dd')
                      })
                    }
                    className="px-3 py-1.5 text-xs font-semibold rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading reports...</div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Student</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white mt-2">{selectedStudent?.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{selectedStudent?.gradeLevel}</div>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Activities</div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{totalActivities}</div>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Hours</div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{totalHours}</div>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Days</div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{dailySummaries.length}</div>
                </div>
              </div>

              {/* Subject Breakdown */}
              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-8">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">By Subject</h2>
                {activitySummary.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No activities in this date range.</p>
                ) : (
                  <div className="space-y-4">
                    {activitySummary.map((summary) => {
                      const percentage = totalMinutes > 0 ? (summary.totalMinutes / totalMinutes) * 100 : 0
                      return (
                        <div key={summary.subjectId}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900 dark:text-white">{summary.subjectName}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {summary.totalActivities} activities • {Math.round(summary.totalMinutes / 60 * 10) / 10} hrs
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-fuchsia-500 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          {/* Activity type breakdown */}
                          <div className="mt-2 flex flex-wrap gap-2">
                            {Object.entries(summary.byType).map(([type, count]) => {
                              if (count === 0) return null
                              return (
                                <span
                                  key={type}
                                  className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300"
                                >
                                  {type.replace('_', ' ')}: {count}
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Recent Daily Activity */}
              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daily Activity</h2>
                {dailySummaries.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No activity in this date range.</p>
                ) : (
                  <div className="space-y-2">
                    {dailySummaries.slice(0, 14).map((day) => (
                      <div
                        key={day.date}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {format(parseISO(day.date), 'EEEE, MMMM d')}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {day.activitiesCount} activities • {day.totalMinutes} min
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {Array.from({ length: Math.min(day.activitiesCount, 10) }).map((_, i) => (
                            <div key={i} className="w-2 h-2 rounded-full bg-fuchsia-500" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Portfolio Export */}
              <div className="mt-8">
                <PortfolioExport students={students} />
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
