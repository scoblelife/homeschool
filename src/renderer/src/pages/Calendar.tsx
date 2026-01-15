import { useState, useEffect } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  parseISO
} from 'date-fns'
import { Dialog } from '@headlessui/react'
import { useStore } from '../stores/useStore'
import type { Session, Activity, CreateActivity, ActivityType, CalendarBusyEvent, FieldTrip } from '../../../shared/types'

const activityTypes: { value: ActivityType; label: string; icon: string }[] = [
  { value: 'worksheet', label: 'Worksheet', icon: '📝' },
  { value: 'video', label: 'Video', icon: '🎬' },
  { value: 'reading', label: 'Reading', icon: '📖' },
  { value: 'writing_print', label: 'Print', icon: '✏️' },
  { value: 'writing_cursive', label: 'Cursive', icon: '✍️' },
  { value: 'hands_on', label: 'Hands-on', icon: '🎨' },
  { value: 'game', label: 'Game', icon: '🎮' },
  { value: 'assessment', label: 'Test', icon: '📋' },
  { value: 'field_trip', label: 'Field Trip', icon: '🚌' }
]

// Colors for field trip activity types
const fieldTripTypeColors: Record<string, { bg: string; text: string; textDark: string; dot: string; icon: string }> = {
  field_trip: { bg: 'bg-amber-50', text: 'text-amber-600', textDark: 'text-amber-800', dot: 'bg-amber-500', icon: '🚌' },
  park_day: { bg: 'bg-green-50', text: 'text-green-600', textDark: 'text-green-800', dot: 'bg-green-500', icon: '🌳' },
  game_night: { bg: 'bg-purple-50', text: 'text-purple-600', textDark: 'text-purple-800', dot: 'bg-purple-500', icon: '🎲' },
  playdate: { bg: 'bg-pink-50', text: 'text-pink-600', textDark: 'text-pink-800', dot: 'bg-pink-500', icon: '👋' },
  coop_class: { bg: 'bg-blue-50', text: 'text-blue-600', textDark: 'text-blue-800', dot: 'bg-blue-500', icon: '📚' },
  custom: { bg: 'bg-gray-50', text: 'text-gray-600', textDark: 'text-gray-800', dot: 'bg-gray-500', icon: '📅' }
}

function getFieldTripColors(activityType: string | undefined) {
  return fieldTripTypeColors[activityType || 'field_trip'] || fieldTripTypeColors.field_trip
}

// Load persisted date from localStorage or default to today
function getInitialSelectedDate(): Date {
  const stored = localStorage.getItem('calendar-selected-date')
  if (stored) {
    const parsed = parseISO(stored)
    if (!isNaN(parsed.getTime())) {
      return parsed
    }
  }
  return new Date()
}

function getInitialMonth(): Date {
  const stored = localStorage.getItem('calendar-selected-date')
  if (stored) {
    const parsed = parseISO(stored)
    if (!isNaN(parsed.getTime())) {
      return startOfMonth(parsed)
    }
  }
  return new Date()
}

/**
 * Render an interactive month calendar with day details, event listings, and an activity log UI.
 *
 * The component displays a full monthly calendar grid, allows navigating months and selecting a date,
 * and shows sessions, activities, field trips, and external "busy" calendar events for the selected date.
 * It loads data for the visible month scoped to the currently selected student (if any), persists the selected
 * date to localStorage, and provides controls to add and delete activities.
 *
 * @returns The calendar user interface as a JSX element.
 */
export default function Calendar(): JSX.Element {
  const { students, subjects, selectedStudentId, getStudentById, getSubjectById } = useStore()
  const [currentMonth, setCurrentMonth] = useState(getInitialMonth)
  const [sessions, setSessions] = useState<Session[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [fieldTrips, setFieldTrips] = useState<FieldTrip[]>([])
  const [busyEvents, setBusyEvents] = useState<CalendarBusyEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(getInitialSelectedDate)
  const [showAddActivity, setShowAddActivity] = useState(false)
  const [formData, setFormData] = useState<Partial<CreateActivity>>({
    studentId: '',
    subjectId: '',
    activityType: 'worksheet',
    title: '',
    dateCompleted: '',
    durationMinutes: null,
    notes: ''
  })

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Handle date selection with persistence
  const handleSelectDate = (date: Date) => {
    setSelectedDate(date)
    localStorage.setItem('calendar-selected-date', format(date, 'yyyy-MM-dd'))
  }

  // Go to today
  const goToToday = () => {
    const today = new Date()
    setCurrentMonth(today)
    handleSelectDate(today)
  }

  useEffect(() => {
    async function loadMonthData(): Promise<void> {
      const startDate = format(calendarStart, 'yyyy-MM-dd')
      const endDate = format(calendarEnd, 'yyyy-MM-dd')

      const [sessionsData, activitiesData, fieldTripsData] = await Promise.all([
        window.api.getSessions({
          studentId: selectedStudentId || undefined,
          startDate,
          endDate
        }),
        window.api.getActivities({
          studentId: selectedStudentId || undefined,
          startDate,
          endDate
        }),
        window.api.getFieldTrips(
          selectedStudentId ? { studentId: selectedStudentId } : undefined
        )
      ])

      setSessions(sessionsData)
      setActivities(activitiesData)
      // Filter field trips to only show ones in the current date range
      const filteredTrips = fieldTripsData.filter((trip) => {
        return trip.date >= startDate && trip.date <= endDate
      })
      setFieldTrips(filteredTrips)

      // Fetch calendar events from iCal feeds
      const selectedStudent = selectedStudentId ? getStudentById(selectedStudentId) : null
      if (selectedStudent?.calendarFeedUrl) {
        const events = await window.api.fetchCalendarEvents(
          selectedStudent.calendarFeedUrl,
          startDate,
          endDate
        )
        setBusyEvents(events)
      } else {
        setBusyEvents([])
      }
    }
    loadMonthData()
  }, [currentMonth, selectedStudentId, calendarStart, calendarEnd, getStudentById])

  const getEventsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const daySessions = sessions.filter((s) => s.date === dateStr)
    const dayActivities = activities.filter((a) => a.dateCompleted === dateStr)
    const dayFieldTrips = fieldTrips.filter((t) => t.date === dateStr)
    return { sessions: daySessions, activities: dayActivities, fieldTrips: dayFieldTrips }
  }

  const getBusyEventsForDay = (date: Date): CalendarBusyEvent[] => {
    return busyEvents.filter((event) => {
      const eventStart = parseISO(event.start)
      const eventEnd = parseISO(event.end)
      // Check if date falls within event range (inclusive)
      return isWithinInterval(date, { start: eventStart, end: eventEnd }) ||
        isSameDay(date, eventStart) || isSameDay(date, eventEnd)
    })
  }

  const selectedDayEvents = getEventsForDay(selectedDate)
  const selectedDayBusy = getBusyEventsForDay(selectedDate)

  const openAddActivity = () => {
    setFormData({
      studentId: selectedStudentId || '',
      subjectId: '',
      activityType: 'worksheet',
      title: '',
      dateCompleted: format(selectedDate, 'yyyy-MM-dd'),
      durationMinutes: null,
      notes: ''
    })
    setShowAddActivity(true)
  }

  const handleSubmitActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.studentId || !formData.subjectId || !formData.title || !formData.dateCompleted) return

    const newActivity = await window.api.createActivity({
      studentId: formData.studentId,
      subjectId: formData.subjectId,
      sessionId: null,
      activityType: formData.activityType || 'worksheet',
      title: formData.title,
      description: '',
      dateCompleted: formData.dateCompleted,
      durationMinutes: formData.durationMinutes || null,
      grade: null,
      maxGrade: null,
      notes: formData.notes || ''
    })

    setActivities([...activities, newActivity])
    setShowAddActivity(false)
  }

  const handleDeleteActivity = async (id: string) => {
    await window.api.deleteActivity(id)
    setActivities(activities.filter((a) => a.id !== id))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendar</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="btn btn-secondary"
          >
            ← Prev
          </button>
          <span className="text-lg font-semibold text-gray-900 dark:text-white">{format(currentMonth, 'MMMM yyyy')}</span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="btn btn-secondary"
          >
            Next →
          </button>
          <button
            onClick={goToToday}
            className="btn btn-primary"
          >
            Today
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <div className="card">
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const events = getEventsForDay(day)
                const dayBusy = getBusyEventsForDay(day)
                const hasEvents = events.sessions.length > 0 || events.activities.length > 0 || events.fieldTrips.length > 0
                const hasFieldTrip = events.fieldTrips.length > 0
                const isBusy = dayBusy.length > 0
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const isSelected = selectedDate && isSameDay(day, selectedDate)
                const isToday = isSameDay(day, new Date())
                // Get the first field trip's color for background (if multiple, show first)
                const firstTripColors = hasFieldTrip ? getFieldTripColors(events.fieldTrips[0].activityType) : null

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => handleSelectDate(day)}
                    className={`aspect-square p-2 rounded-lg text-left transition-colors ${
                      !isCurrentMonth ? 'text-gray-300 dark:text-gray-600' : 'text-gray-900 dark:text-white'
                    } ${isSelected ? 'bg-fuchsia-100 dark:bg-fuchsia-900/50 ring-2 ring-fuchsia-500' : 'hover:bg-gray-50 dark:hover:bg-gray-700'} ${
                      isToday && !isSelected ? 'bg-yellow-50 dark:bg-yellow-900/30' : ''
                    } ${hasFieldTrip && isCurrentMonth && !isSelected ? firstTripColors?.bg : ''} ${
                      isBusy && isCurrentMonth && !isSelected && !hasFieldTrip ? 'bg-red-50 dark:bg-red-900/30' : ''
                    }`}
                  >
                    <div
                      className={`text-sm font-medium ${isToday ? 'text-fuchsia-600 dark:text-fuchsia-400' : ''} ${hasFieldTrip && isCurrentMonth ? firstTripColors?.text : ''} ${isBusy && isCurrentMonth && !hasFieldTrip ? 'text-red-600 dark:text-red-400' : ''}`}
                    >
                      {format(day, 'd')}
                    </div>
                    {(hasEvents || isBusy) && isCurrentMonth && (
                      <div className="mt-1 flex gap-1 flex-wrap">
                        {isBusy && (
                          <div className="w-2 h-2 rounded-full bg-red-500" title="Busy" />
                        )}
                        {events.fieldTrips.map((trip) => {
                          const colors = getFieldTripColors(trip.activityType)
                          return (
                            <div
                              key={trip.id}
                              className={`w-2 h-2 rounded-full ${colors.dot}`}
                              title={trip.title}
                            />
                          )
                        })}
                        {events.activities.length > 0 && (
                          <div className="w-2 h-2 rounded-full bg-green-500" title="Activities" />
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Activities</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span>🚌 Field Trip</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>🌳 Park Day</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span>🎲 Game Night</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-pink-500" />
                <span>👋 Playdate</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>📚 Co-op</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span>Busy (External)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Day Details */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {format(selectedDate, 'EEEE, MMMM d')}
            </h2>
            <button onClick={openAddActivity} className="btn btn-primary text-sm">
              + Log Activity
            </button>
          </div>

          <div className="space-y-6">
              {/* Field Trips / Activities */}
              {selectedDayEvents.fieldTrips.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                    Events ({selectedDayEvents.fieldTrips.length})
                  </h3>
                  <ul className="space-y-2">
                    {selectedDayEvents.fieldTrips.map((trip) => {
                      const tripStudents = students.filter((s) => trip.studentIds.includes(s.id))
                      const colors = getFieldTripColors(trip.activityType)
                      return (
                        <li key={trip.id} className={`p-2 ${colors.bg} dark:bg-opacity-20 rounded-lg text-sm`}>
                          <div className={`font-medium ${colors.textDark} flex items-center gap-2`}>
                            <span>{colors.icon}</span>
                            {trip.title}
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              trip.status === 'completed' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' :
                              trip.status === 'cancelled' ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300' :
                              'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                            }`}>
                              {trip.status}
                            </span>
                          </div>
                          <div className={`${colors.text} mt-1`}>
                            📍 {trip.location}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400 mt-1">
                            {tripStudents.map((s) => s.name).join(', ')}
                          </div>
                          {trip.websiteUrl && (
                            <a
                              href={trip.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
                            >
                              🔗 Website
                            </a>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              {/* Busy Events */}
              {selectedDayBusy.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                    Busy ({selectedDayBusy.length})
                  </h3>
                  <ul className="space-y-2">
                    {selectedDayBusy.map((event, idx) => (
                      <li key={idx} className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg text-sm">
                        <div className="font-medium text-red-700 dark:text-red-300">
                          {event.summary || 'Busy'}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Activities */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Activities ({selectedDayEvents.activities.length})
                </h3>
                {selectedDayEvents.activities.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500">No activities logged</p>
                ) : (
                  <ul className="space-y-2">
                    {selectedDayEvents.activities.map((activity) => {
                      const student = getStudentById(activity.studentId)
                      const typeInfo = activityTypes.find((t) => t.value === activity.activityType)
                      return (
                        <li key={activity.id} className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-start justify-between">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                              <span>{typeInfo?.icon}</span>
                              {activity.title}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {student?.name} • {typeInfo?.label}
                              {activity.durationMinutes && ` • ${activity.durationMinutes} min`}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteActivity(activity.id)}
                            className="text-red-400 hover:text-red-600 text-sm"
                          >
                            ×
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
          </div>
        </div>
      </div>

      {/* Add Activity Modal */}
      <Dialog open={showAddActivity} onClose={() => setShowAddActivity(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Log Activity - {format(selectedDate, 'MMM d, yyyy')}
            </Dialog.Title>

            <form onSubmit={handleSubmitActivity} className="space-y-4">
              <div>
                <label className="label">Activity Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {activityTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, activityType: type.value })}
                      className={`p-2 rounded-lg text-center transition-colors ${
                        formData.activityType === type.value
                          ? 'bg-fuchsia-100 dark:bg-fuchsia-900/50 ring-2 ring-fuchsia-500'
                          : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="text-xl">{type.icon}</div>
                      <div className="text-xs mt-1 text-gray-700 dark:text-gray-300">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Student</label>
                <select
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Select student...</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Subject</label>
                <select
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Select subject...</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                  placeholder="e.g., Math worksheet Chapter 5"
                  required
                />
              </div>

              <div>
                <label className="label">Duration (minutes)</label>
                <input
                  type="number"
                  value={formData.durationMinutes || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      durationMinutes: e.target.value ? parseInt(e.target.value) : null
                    })
                  }
                  className="input"
                  min="1"
                />
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowAddActivity(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Log Activity
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  )
}