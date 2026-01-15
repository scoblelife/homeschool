/**
 * Annual Report Page
 *
 * Year-over-year comparison and annual progress tracking.
 */

import { useState, useEffect, useMemo } from 'react'
import { format, startOfYear, endOfYear, parseISO, eachMonthOfInterval, subYears } from 'date-fns'
import { useStore } from '../stores/useStore'
import { getStudentColor } from './Settings'
import type { Activity, DailySummary, Subject } from '../../../shared/types'

interface MonthlyData {
  month: string
  activities: number
  minutes: number
}

interface YearlyStats {
  year: number
  totalActivities: number
  totalMinutes: number
  totalDays: number
  bySubject: Record<string, { activities: number; minutes: number }>
  monthlyData: MonthlyData[]
}

export default function AnnualReport(): JSX.Element {
  const { students, subjects, selectedStudentId, getStudentById } = useStore()
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [currentYearStats, setCurrentYearStats] = useState<YearlyStats | null>(null)
  const [previousYearStats, setPreviousYearStats] = useState<YearlyStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const selectedStudent = selectedStudentId ? getStudentById(selectedStudentId) : null

  useEffect(() => {
    if (selectedStudentId) {
      loadYearlyData()
    }
  }, [selectedStudentId, currentYear])

  const loadYearlyData = async () => {
    if (!selectedStudentId) return

    setIsLoading(true)

    const currentYearStart = startOfYear(new Date(currentYear, 0, 1))
    const currentYearEnd = endOfYear(new Date(currentYear, 0, 1))
    const previousYearStart = startOfYear(subYears(currentYearStart, 1))
    const previousYearEnd = endOfYear(subYears(currentYearStart, 1))

    const [currentActivities, previousActivities, currentDailies, previousDailies] = await Promise.all([
      window.api.getActivities({
        studentId: selectedStudentId,
        startDate: format(currentYearStart, 'yyyy-MM-dd'),
        endDate: format(currentYearEnd, 'yyyy-MM-dd'),
      }),
      window.api.getActivities({
        studentId: selectedStudentId,
        startDate: format(previousYearStart, 'yyyy-MM-dd'),
        endDate: format(previousYearEnd, 'yyyy-MM-dd'),
      }),
      window.api.getDailySummaries(
        selectedStudentId,
        format(currentYearStart, 'yyyy-MM-dd'),
        format(currentYearEnd, 'yyyy-MM-dd')
      ),
      window.api.getDailySummaries(
        selectedStudentId,
        format(previousYearStart, 'yyyy-MM-dd'),
        format(previousYearEnd, 'yyyy-MM-dd')
      ),
    ])

    setCurrentYearStats(calculateYearlyStats(currentYear, currentActivities, currentDailies, subjects))
    setPreviousYearStats(calculateYearlyStats(currentYear - 1, previousActivities, previousDailies, subjects))
    setIsLoading(false)
  }

  const calculateYearlyStats = (
    year: number,
    activities: Activity[],
    dailies: DailySummary[],
    subjectList: Subject[]
  ): YearlyStats => {
    const totalActivities = activities.length
    const totalMinutes = activities.reduce((sum, a) => sum + (a.durationMinutes || 0), 0)
    const totalDays = dailies.filter((d) => d.activitiesCount > 0).length

    // Group by subject
    const bySubject: Record<string, { activities: number; minutes: number }> = {}
    activities.forEach((activity) => {
      const subjectId = activity.subjectId
      if (!bySubject[subjectId]) {
        bySubject[subjectId] = { activities: 0, minutes: 0 }
      }
      bySubject[subjectId].activities += 1
      bySubject[subjectId].minutes += activity.durationMinutes || 0
    })

    // Monthly breakdown
    const yearStart = startOfYear(new Date(year, 0, 1))
    const yearEnd = endOfYear(new Date(year, 0, 1))
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd })

    const monthlyData: MonthlyData[] = months.map((monthDate) => {
      const monthStr = format(monthDate, 'yyyy-MM')
      const monthActivities = activities.filter((a) =>
        a.dateCompleted.startsWith(monthStr)
      )
      return {
        month: format(monthDate, 'MMM'),
        activities: monthActivities.length,
        minutes: monthActivities.reduce((sum, a) => sum + (a.durationMinutes || 0), 0),
      }
    })

    return {
      year,
      totalActivities,
      totalMinutes,
      totalDays,
      bySubject,
      monthlyData,
    }
  }

  const formatHours = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}m`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  const calculateChange = (current: number, previous: number): { value: number; isPositive: boolean } => {
    if (previous === 0) return { value: current > 0 ? 100 : 0, isPositive: current > 0 }
    const change = ((current - previous) / previous) * 100
    return { value: Math.abs(Math.round(change)), isPositive: change >= 0 }
  }

  const handleExportReport = () => {
    if (!selectedStudent || !currentYearStats) return

    const reportData = {
      student: selectedStudent.name,
      year: currentYear,
      stats: currentYearStats,
      previousYear: previousYearStats,
      generatedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedStudent.name}-annual-report-${currentYear}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const maxMonthlyActivities = useMemo(() => {
    if (!currentYearStats) return 0
    return Math.max(...currentYearStats.monthlyData.map((m) => m.activities), 1)
  }, [currentYearStats])

  if (!selectedStudent) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Annual Report</h1>
        <p className="text-gray-500 dark:text-gray-400">Please select a student to view their annual report.</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Annual Report</h1>
          <p className="text-gray-500 dark:text-gray-400">{selectedStudent.name}'s learning progress</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentYear((y) => y - 1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-lg font-semibold min-w-[60px] text-center text-gray-900 dark:text-white">{currentYear}</span>
            <button
              onClick={() => setCurrentYear((y) => y + 1)}
              disabled={currentYear >= new Date().getFullYear()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 text-gray-700 dark:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <button onClick={handleExportReport} className="btn btn-primary">
            Export Report
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading annual data...</div>
      ) : currentYearStats ? (
        <>
          {/* Year Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Activities"
              value={currentYearStats.totalActivities}
              previousValue={previousYearStats?.totalActivities || 0}
              formatValue={(v) => v.toString()}
            />
            <StatCard
              title="Total Hours"
              value={currentYearStats.totalMinutes}
              previousValue={previousYearStats?.totalMinutes || 0}
              formatValue={(v) => formatHours(v)}
            />
            <StatCard
              title="Active Days"
              value={currentYearStats.totalDays}
              previousValue={previousYearStats?.totalDays || 0}
              formatValue={(v) => v.toString()}
            />
            <StatCard
              title="Avg Minutes/Day"
              value={currentYearStats.totalDays > 0 ? Math.round(currentYearStats.totalMinutes / currentYearStats.totalDays) : 0}
              previousValue={previousYearStats && previousYearStats.totalDays > 0 ? Math.round(previousYearStats.totalMinutes / previousYearStats.totalDays) : 0}
              formatValue={(v) => `${v}m`}
            />
          </div>

          {/* Monthly Activity Chart */}
          <div className="card mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Activity</h2>
            <div className="flex items-end gap-2 h-48">
              {currentYearStats.monthlyData.map((month, i) => {
                const height = (month.activities / maxMonthlyActivities) * 100
                const previousMonth = previousYearStats?.monthlyData[i]
                const previousHeight = previousMonth
                  ? (previousMonth.activities / maxMonthlyActivities) * 100
                  : 0

                return (
                  <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="relative w-full flex justify-center gap-1" style={{ height: '160px' }}>
                      {/* Previous year bar */}
                      <div
                        className="w-3 bg-gray-200 dark:bg-gray-600 rounded-t self-end transition-all"
                        style={{ height: `${previousHeight}%` }}
                        title={`${currentYear - 1}: ${previousMonth?.activities || 0} activities`}
                      />
                      {/* Current year bar */}
                      <div
                        className={`w-3 rounded-t self-end transition-all ${getStudentColor(selectedStudent.color).bg}`}
                        style={{ height: `${height}%` }}
                        title={`${currentYear}: ${month.activities} activities`}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{month.month}</span>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${getStudentColor(selectedStudent.color).bg}`} />
                <span>{currentYear}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-600" />
                <span>{currentYear - 1}</span>
              </div>
            </div>
          </div>

          {/* Subject Breakdown */}
          <div className="card mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">By Subject</h2>
            <div className="space-y-4">
              {subjects.map((subject) => {
                const current = currentYearStats.bySubject[subject.id] || { activities: 0, minutes: 0 }
                const previous = previousYearStats?.bySubject[subject.id] || { activities: 0, minutes: 0 }
                const change = calculateChange(current.minutes, previous.minutes)

                return (
                  <div key={subject.id} className="flex items-center gap-4">
                    <div className="w-32 text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{subject.name}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getStudentColor(selectedStudent.color).bg} transition-all`}
                            style={{
                              width: `${Math.min((current.minutes / Math.max(currentYearStats.totalMinutes, 1)) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-300 min-w-[60px] text-right">
                          {formatHours(current.minutes)}
                        </span>
                      </div>
                    </div>
                    <div className="w-24 text-right">
                      {previous.minutes > 0 && (
                        <span
                          className={`text-sm ${
                            change.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {change.isPositive ? '↑' : '↓'} {change.value}%
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Year-over-Year Comparison Table */}
          {previousYearStats && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Year-over-Year Comparison</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-4 text-gray-700 dark:text-gray-200">Metric</th>
                      <th className="text-right py-2 px-4 text-gray-700 dark:text-gray-200">{currentYear - 1}</th>
                      <th className="text-right py-2 px-4 text-gray-700 dark:text-gray-200">{currentYear}</th>
                      <th className="text-right py-2 px-4 text-gray-700 dark:text-gray-200">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    <ComparisonRow
                      label="Total Activities"
                      current={currentYearStats.totalActivities}
                      previous={previousYearStats.totalActivities}
                      format={(v) => v.toString()}
                    />
                    <ComparisonRow
                      label="Total Hours"
                      current={currentYearStats.totalMinutes}
                      previous={previousYearStats.totalMinutes}
                      format={(v) => formatHours(v)}
                    />
                    <ComparisonRow
                      label="Active Days"
                      current={currentYearStats.totalDays}
                      previous={previousYearStats.totalDays}
                      format={(v) => v.toString()}
                    />
                    <ComparisonRow
                      label="Avg per Day"
                      current={currentYearStats.totalDays > 0 ? Math.round(currentYearStats.totalMinutes / currentYearStats.totalDays) : 0}
                      previous={previousYearStats.totalDays > 0 ? Math.round(previousYearStats.totalMinutes / previousYearStats.totalDays) : 0}
                      format={(v) => `${v} min`}
                    />
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">No data available for this year.</div>
      )}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: number
  previousValue: number
  formatValue: (v: number) => string
}

function StatCard({ title, value, previousValue, formatValue }: StatCardProps): JSX.Element {
  const change = previousValue > 0
    ? Math.round(((value - previousValue) / previousValue) * 100)
    : value > 0 ? 100 : 0
  const isPositive = change >= 0

  return (
    <div className="card bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{formatValue(value)}</div>
      {previousValue > 0 && (
        <div className={`text-sm mt-2 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {isPositive ? '↑' : '↓'} {Math.abs(change)}% vs last year
        </div>
      )}
    </div>
  )
}

interface ComparisonRowProps {
  label: string
  current: number
  previous: number
  format: (v: number) => string
}

function ComparisonRow({ label, current, previous, format }: ComparisonRowProps): JSX.Element {
  const change = previous > 0
    ? Math.round(((current - previous) / previous) * 100)
    : current > 0 ? 100 : 0
  const isPositive = change >= 0

  return (
    <tr className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <td className="py-3 px-4 text-gray-700 dark:text-gray-200">{label}</td>
      <td className="py-3 px-4 text-right text-gray-500 dark:text-gray-400">{format(previous)}</td>
      <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">{format(current)}</td>
      <td className={`py-3 px-4 text-right ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
        {isPositive ? '+' : ''}{change}%
      </td>
    </tr>
  )
}
