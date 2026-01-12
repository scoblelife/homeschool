import { useState, useEffect, useMemo, useCallback } from 'react'
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, parseISO, eachDayOfInterval, isToday, addHours, addDays } from 'date-fns'
import { Dialog, Tab } from '@headlessui/react'
import { useStore } from '../stores/useStore'
import { useMilestones } from '../hooks/useDatabase'
import type { Milestone, MilestoneResource, CreateResource, CalendarSyncRecord, SubjectChoreMapping, StudentReward } from '../../../shared/types'

// Map student colors to Google Calendar color IDs
// See: https://developers.google.com/calendar/api/v3/reference/colors
const GOOGLE_CALENDAR_COLORS: Record<string, string> = {
  fuchsia: '4',  // Flamingo (pink)
  child1: '4',   // Legacy
  teal: '7',     // Peacock (teal)
  child2: '7',   // Legacy
  blue: '9',     // Blueberry
  orange: '6',   // Tangerine
  purple: '3',   // Grape
  green: '10',   // Basil
}

// Helper to get current week start (Monday)
function getCurrentWeekStart(): Date {
  return startOfWeek(new Date(), { weekStartsOn: 1 })
}

export default function WeeklyPlanner(): JSX.Element {
  const { selectedStudentId, getSelectedStudent, getSubjectById } = useStore()
  const { milestones } = useMilestones(selectedStudentId ?? undefined)
  const selectedStudent = getSelectedStudent()

  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    format(getCurrentWeekStart(), 'yyyy-MM-dd')
  )
  const [selectedMilestoneIds, setSelectedMilestoneIds] = useState<string[]>([])
  const [allResources, setAllResources] = useState<Record<string, MilestoneResource[]>>({})
  const [showAddMilestone, setShowAddMilestone] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Resource management state
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [showAddResource, setShowAddResource] = useState(false)
  const [resourceMilestoneId, setResourceMilestoneId] = useState<string | null>(null)
  const [urlForm, setUrlForm] = useState({ title: '', url: '' })
  const [fileTitle, setFileTitle] = useState('')

  // Calendar sync state
  const [calendarId, setCalendarId] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncRecords, setSyncRecords] = useState<CalendarSyncRecord[]>([])
  const [showSyncOptions, setShowSyncOptions] = useState(false)
  const [syncAllDay, setSyncAllDay] = useState(true)

  // Skylight chore mapping state
  const [choreMappings, setChoreMappings] = useState<SubjectChoreMapping[]>([])
  const [weeklyRewards, setWeeklyRewards] = useState<StudentReward[]>([])

  // Parse the stored date string properly using parseISO
  const weekStartDate = parseISO(currentWeekStart)
  const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 })

  // Get all days of the week for display
  const weekDays = eachDayOfInterval({ start: weekStartDate, end: weekEndDate })

  const weekEnd = format(weekEndDate, 'MMM d, yyyy')
  const weekStartFormatted = format(weekStartDate, 'MMM d')

  // Load weekly plan when student or week changes
  useEffect(() => {
    if (selectedStudentId) {
      loadWeeklyPlan()
    }
  }, [selectedStudentId, currentWeekStart])

  // Load resources for selected milestones
  useEffect(() => {
    loadAllResources()
  }, [selectedMilestoneIds])

  const loadWeeklyPlan = async () => {
    if (!selectedStudentId) return
    const plan = await window.api.getWeeklyPlan(selectedStudentId, currentWeekStart)
    if (plan) {
      setSelectedMilestoneIds(plan.milestoneIds)
    } else {
      setSelectedMilestoneIds([])
    }
  }

  const loadAllResources = async () => {
    const resourceMap: Record<string, MilestoneResource[]> = {}
    for (const id of selectedMilestoneIds) {
      const resources = await window.api.getResources(id)
      resourceMap[id] = resources
    }
    setAllResources(resourceMap)
  }

  // Load calendar settings and sync records
  useEffect(() => {
    loadCalendarSettings()
    loadChoreMappings()
  }, [])

  // Load weekly rewards when student or week changes
  useEffect(() => {
    if (selectedStudentId) {
      loadWeeklyRewards()
    }
  }, [selectedStudentId, currentWeekStart])

  const loadChoreMappings = async () => {
    const mappings = await window.api.getChoreMappings()
    setChoreMappings(mappings)
  }

  const loadWeeklyRewards = async () => {
    if (!selectedStudentId) return
    const rewards = await window.api.getStudentRewards(selectedStudentId, currentWeekStart)
    setWeeklyRewards(rewards)
  }

  useEffect(() => {
    if (calendarId) {
      loadSyncRecords()
    }
  }, [currentWeekStart, calendarId])

  const loadCalendarSettings = async () => {
    const savedCalendarId = await window.api.getSetting('google_calendar_id')
    setCalendarId(savedCalendarId)

    const savedAllDay = await window.api.getSetting('sync_all_day_events')
    setSyncAllDay(savedAllDay !== 'false')
  }

  const loadSyncRecords = async () => {
    const records = await window.api.getCalendarSyncRecordsForWeek(currentWeekStart)
    setSyncRecords(records)
  }

  // Sync milestones to Google Calendar
  const syncToCalendar = useCallback(async () => {
    if (!calendarId || !selectedStudentId || !selectedStudent) return

    setIsSyncing(true)
    try {
      const currentRecords = await window.api.getCalendarSyncRecordsForWeek(currentWeekStart)
      const currentRecordMap = new Map(currentRecords.map(r => [r.milestoneId, r]))

      // Get subjects for milestone titles
      const subjectNames: Record<string, string> = {}

      // Map student color to Google Calendar colorId
      const colorId = GOOGLE_CALENDAR_COLORS[selectedStudent.color] || '4'

      // Process each selected milestone
      for (const milestoneId of selectedMilestoneIds) {
        const milestone = milestones.find(m => m.id === milestoneId)
        if (!milestone) continue

        // Get subject name
        if (!subjectNames[milestone.subjectId]) {
          const subject = getSubjectById(milestone.subjectId)
          subjectNames[milestone.subjectId] = subject?.name || 'Unknown'
        }

        // Build event with student name
        const isCompleted = milestone.status === 'completed'
        const eventTitle = isCompleted
          ? `✓ ${selectedStudent.name}: [${subjectNames[milestone.subjectId]}] ${milestone.title}`
          : `${selectedStudent.name}: [${subjectNames[milestone.subjectId]}] ${milestone.title}`

        const description = [
          `Student: ${selectedStudent.name}`,
          `Subject: ${subjectNames[milestone.subjectId]}`,
          `Status: ${milestone.status}`,
          '',
          milestone.description || ''
        ].join('\n')

        // Use milestone's targetDate if set, otherwise distribute across weekdays
        let eventDate: string
        if (milestone.targetDate) {
          eventDate = milestone.targetDate
        } else {
          // Distribute milestones across Mon-Fri based on their index
          const milestoneIndex = selectedMilestoneIds.indexOf(milestoneId)
          const dayOffset = milestoneIndex % 5 // 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri
          const weekStart = parseISO(currentWeekStart)
          eventDate = format(addDays(weekStart, dayOffset), 'yyyy-MM-dd')
        }
        let start: string, end: string

        if (syncAllDay) {
          start = eventDate
          end = eventDate
        } else {
          // Create timed event (9am-10am)
          const startDate = parseISO(eventDate)
          start = addHours(startDate, 9).toISOString()
          end = addHours(startDate, 10).toISOString()
        }

        const existingRecord = currentRecordMap.get(milestoneId)

        if (existingRecord) {
          // Update existing event
          await window.api.updateGoogleCalendarEvent(calendarId, existingRecord.googleEventId, {
            summary: eventTitle,
            description,
            start,
            end,
            allDay: syncAllDay,
            colorId
          })
        } else {
          // Create new event
          const eventId = await window.api.createGoogleCalendarEvent(calendarId, {
            summary: eventTitle,
            description,
            start,
            end,
            allDay: syncAllDay,
            colorId
          })
          await window.api.upsertCalendarSyncRecord(milestoneId, currentWeekStart, eventId, calendarId)
        }

        currentRecordMap.delete(milestoneId)
      }

      // Delete events for milestones no longer in the plan (only for current student)
      const remainingRecords = Array.from(currentRecordMap.values())
      for (const record of remainingRecords) {
        // Only delete if this milestone belongs to the current student
        const milestone = milestones.find(m => m.id === record.milestoneId)
        if (milestone) {
          await window.api.deleteGoogleCalendarEvent(calendarId, record.googleEventId)
          await window.api.deleteCalendarSyncRecord(record.milestoneId, currentWeekStart)
        }
        // If milestone not found in current student's milestones, leave it alone (belongs to another student)
      }

      await loadSyncRecords()
    } catch (error) {
      console.error('Sync failed:', error)
      alert('Failed to sync to calendar. Please check your connection and try again.')
    } finally {
      setIsSyncing(false)
    }
  }, [calendarId, selectedStudentId, selectedMilestoneIds, currentWeekStart, milestones, syncAllDay, getSubjectById])

  const saveWeeklyPlan = async (ids: string[]) => {
    if (!selectedStudentId) return
    await window.api.saveWeeklyPlan(selectedStudentId, currentWeekStart, ids)
    setSelectedMilestoneIds(ids)
  }

  const handleAutoSuggest = async () => {
    if (!selectedStudentId) return
    setIsLoading(true)
    try {
      // Suggest ~3 milestones per day for a 5-day week, distributed across subjects
      const suggested = await window.api.getSuggestedMilestones(selectedStudentId, 15)
      const ids = suggested.map((m) => m.id)
      await saveWeeklyPlan(ids)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveMilestone = async (id: string) => {
    const newIds = selectedMilestoneIds.filter((mid) => mid !== id)
    await saveWeeklyPlan(newIds)
  }

  const handleAddMilestone = async (id: string) => {
    if (selectedMilestoneIds.includes(id)) return
    const newIds = [...selectedMilestoneIds, id]
    await saveWeeklyPlan(newIds)
    setShowAddMilestone(false)
  }

  const handleToggleComplete = async (milestone: Milestone) => {
    const newStatus = milestone.status === 'completed' ? 'in_progress' : 'completed'
    await window.api.updateMilestone(milestone.id, { status: newStatus })

    // Create reward entry when completing a milestone
    if (newStatus === 'completed' && selectedStudentId) {
      await window.api.createReward({
        studentId: selectedStudentId,
        milestoneId: milestone.id,
        starsAwarded: milestone.starValue,
        awardedDate: new Date().toISOString().split('T')[0],
        weekStart: currentWeekStart,
        syncedToSkylight: false
      })
      await loadWeeklyRewards()
    }
    // Note: We don't delete rewards when uncompleting to preserve history
  }

  // Helper to get chore name for a subject
  const getChoreName = (subjectId: string): string | null => {
    const mapping = choreMappings.find(m => m.subjectId === subjectId)
    return mapping?.choreName || null
  }

  // Mark all rewards as synced to Skylight
  const handleMarkAllSynced = async () => {
    const unsyncedRewardIds = weeklyRewards
      .filter(r => !r.syncedToSkylight)
      .map(r => r.id)
    if (unsyncedRewardIds.length > 0) {
      await window.api.markRewardsSynced(unsyncedRewardIds)
      await loadWeeklyRewards()
    }
  }

  const handleStarValueChange = async (milestoneId: string, newValue: number) => {
    const value = Math.max(1, Math.min(10, newValue)) // Clamp between 1-10
    await window.api.updateMilestone(milestoneId, { starValue: value })
  }

  const handleOpenResource = async (resource: MilestoneResource) => {
    await window.api.openResource(resource)
  }

  const handleOpenAllResources = async () => {
    for (const id of selectedMilestoneIds) {
      const resources = allResources[id] || []
      for (const resource of resources) {
        await window.api.openResource(resource)
      }
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const current = parseISO(currentWeekStart)
    const newDate = direction === 'prev' ? subWeeks(current, 1) : addWeeks(current, 1)
    setCurrentWeekStart(format(newDate, 'yyyy-MM-dd'))
  }

  const goToCurrentWeek = () => {
    setCurrentWeekStart(format(getCurrentWeekStart(), 'yyyy-MM-dd'))
  }

  const handleClearWeek = async () => {
    await saveWeeklyPlan([])
  }

  // Resource management functions
  const openAddResource = (milestoneId: string) => {
    setResourceMilestoneId(milestoneId)
    setShowAddResource(true)
    setUrlForm({ title: '', url: '' })
    setFileTitle('')
  }

  const handleAddUrl = async () => {
    if (!resourceMilestoneId || !urlForm.title || !urlForm.url) return
    const data: CreateResource = {
      milestoneId: resourceMilestoneId,
      type: 'url',
      title: urlForm.title,
      url: urlForm.url
    }
    await window.api.createResource(data)
    setShowAddResource(false)
    setUrlForm({ title: '', url: '' })
    loadAllResources()
  }

  const handleUploadFile = async () => {
    if (!resourceMilestoneId) return
    const resource = await window.api.uploadResourceFile(resourceMilestoneId, fileTitle)
    if (resource) {
      setFileTitle('')
      setShowAddResource(false)
      loadAllResources()
    }
  }

  const handleDeleteResource = async (id: string) => {
    await window.api.deleteResource(id)
    loadAllResources()
  }

  // Get selected milestones from store
  const selectedMilestones = useMemo(() => {
    return milestones.filter((m) => selectedMilestoneIds.includes(m.id))
  }, [milestones, selectedMilestoneIds])

  // Group by subject for display
  const groupedMilestones = useMemo(() => {
    const grouped: Record<string, Milestone[]> = {}
    for (const milestone of selectedMilestones) {
      if (!grouped[milestone.subjectId]) {
        grouped[milestone.subjectId] = []
      }
      grouped[milestone.subjectId].push(milestone)
    }
    return grouped
  }, [selectedMilestones])

  // Available milestones (not completed and not already selected)
  const availableMilestones = useMemo(() => {
    return milestones.filter(
      (m) => m.status !== 'completed' && !selectedMilestoneIds.includes(m.id)
    )
  }, [milestones, selectedMilestoneIds])

  // Count total resources
  const totalResources = useMemo(() => {
    return Object.values(allResources).reduce((sum, resources) => sum + resources.length, 0)
  }, [allResources])

  if (!selectedStudent) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Weekly Planner</h1>
        <div className="card text-center py-12">
          <p className="text-gray-500">Please select a student or add one in Settings.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header - hide on print */}
      <div className="no-print flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weekly Planner</h1>
          <p className="text-sm text-gray-500 mt-1">{selectedStudent.name}</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedMilestones.length > 0 && (
            <button
              onClick={handleClearWeek}
              className="btn btn-secondary text-red-600 hover:text-red-700 hover:border-red-300"
            >
              Clear Week
            </button>
          )}
          {calendarId && (
            <div className="relative">
              <button
                onClick={() => setShowSyncOptions(!showSyncOptions)}
                disabled={isSyncing}
                className={`btn ${syncRecords.length > 0 ? 'btn-secondary text-green-600' : 'btn-secondary'}`}
              >
                {isSyncing ? 'Syncing...' : syncRecords.length > 0 ? 'Synced' : 'Sync to Calendar'}
              </button>
              {showSyncOptions && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border p-4 z-10">
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={syncAllDay}
                        onChange={async (e) => {
                          setSyncAllDay(e.target.checked)
                          await window.api.setSetting('sync_all_day_events', String(e.target.checked))
                        }}
                        className="rounded border-gray-300 text-blue-600"
                      />
                      <span>All-day events</span>
                    </label>
                    <button
                      onClick={() => {
                        syncToCalendar()
                        setShowSyncOptions(false)
                      }}
                      className="btn btn-primary w-full"
                    >
                      Sync Now
                    </button>
                    {syncRecords.length > 0 && (
                      <p className="text-xs text-gray-500 text-center">
                        {syncRecords.length} milestone{syncRecords.length !== 1 ? 's' : ''} synced
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <button
            onClick={handleAutoSuggest}
            disabled={isLoading}
            className="btn btn-secondary"
          >
            {isLoading ? 'Loading...' : 'Auto-Suggest'}
          </button>
          <button onClick={() => setShowAddMilestone(true)} className="btn btn-primary">
            + Add Milestone
          </button>
        </div>
      </div>

      {/* Week Navigation - hide on print */}
      <div className="no-print card mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateWeek('prev')}
            className="text-fuchsia-600 hover:text-fuchsia-700 font-medium"
          >
            &larr; Previous Week
          </button>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {weekStartFormatted} - {weekEnd}
            </div>
            <button
              onClick={goToCurrentWeek}
              className="text-sm text-fuchsia-600 hover:underline"
            >
              Go to Current Week
            </button>
          </div>
          <button
            onClick={() => navigateWeek('next')}
            className="text-fuchsia-600 hover:text-fuchsia-700 font-medium"
          >
            Next Week &rarr;
          </button>
        </div>
        {/* Week days strip */}
        <div className="grid grid-cols-7 gap-1 text-center text-sm">
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={`py-2 rounded-lg ${
                isToday(day)
                  ? 'bg-fuchsia-100 text-fuchsia-700 font-semibold'
                  : 'bg-gray-50 text-gray-600'
              }`}
            >
              <div className="text-xs uppercase">{format(day, 'EEE')}</div>
              <div className="text-lg font-medium">{format(day, 'd')}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Print Header - only show on print */}
      <div className="print-only hidden mb-6">
        <h1 className="text-2xl font-bold">Weekly Learning Plan</h1>
        <p className="text-lg">
          {selectedStudent.name} - {weekStartFormatted} to {weekEnd}
        </p>
      </div>

      {/* Stats */}
      <div className="card mb-6">
        <div className="grid grid-cols-4 gap-4 text-center text-sm">
          <div>
            <div className="text-2xl font-bold text-fuchsia-600">{selectedMilestones.length}</div>
            <div className="text-gray-500">Milestones This Week</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {selectedMilestones.filter((m) => m.status === 'completed').length}
            </div>
            <div className="text-gray-500">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-500">
              {selectedMilestones.reduce((sum, m) => sum + m.starValue, 0)}⭐
            </div>
            <div className="text-gray-500">Total Stars</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">{totalResources}</div>
            <div className="text-gray-500">Resources</div>
          </div>
        </div>
      </div>

      {/* Daily Skylight Checklist */}
      {selectedMilestones.filter((m) => m.status === 'completed').length > 0 && (
        <div className="no-print card mb-6 bg-green-50 border-green-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-green-800 flex items-center gap-2">
              <span>📋</span>
              Skylight Checklist ({selectedMilestones.filter(m => m.status === 'completed').reduce((sum, m) => sum + m.starValue, 0)}⭐ earned)
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const completedList = selectedMilestones
                    .filter((m) => m.status === 'completed')
                    .map((m) => {
                      const choreName = getChoreName(m.subjectId)
                      const displayName = choreName || getSubjectById(m.subjectId)?.name || 'Unknown'
                      return `☐ ${displayName} (${m.starValue}⭐) - ${m.title}`
                    })
                    .join('\n')
                  navigator.clipboard.writeText(completedList)
                  alert('Copied to clipboard!')
                }}
                className="text-sm text-green-700 hover:text-green-800 underline"
              >
                Copy to Clipboard
              </button>
              {weeklyRewards.some(r => !r.syncedToSkylight) && (
                <button
                  onClick={handleMarkAllSynced}
                  className="text-sm px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Mark All Synced
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-green-200">
            <p className="text-xs text-gray-500 mb-3">Mark these done in Skylight:</p>
            <div className="space-y-2">
              {selectedMilestones
                .filter((m) => m.status === 'completed')
                .map((m) => {
                  const choreName = getChoreName(m.subjectId)
                  const displayName = choreName || getSubjectById(m.subjectId)?.name || 'Unknown'
                  const reward = weeklyRewards.find(r => r.milestoneId === m.id)
                  const isSynced = reward?.syncedToSkylight

                  return (
                    <div key={m.id} className={`flex items-center gap-3 p-2 rounded ${isSynced ? 'bg-gray-100 text-gray-400' : 'bg-green-50'}`}>
                      <span className="text-lg">{isSynced ? '✅' : '☐'}</span>
                      <span className={`flex-1 ${isSynced ? 'line-through' : 'text-gray-900'}`}>
                        <span className="font-medium">{displayName}</span>
                        <span className="text-gray-500 text-sm ml-2">({m.starValue}⭐)</span>
                        <span className="text-gray-400 text-sm ml-2">- {m.title}</span>
                      </span>
                      {isSynced && (
                        <span className="text-xs text-gray-400">Synced</span>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>

          <p className="text-xs text-green-600 mt-3">
            {weeklyRewards.filter(r => r.syncedToSkylight).length} of {weeklyRewards.length} marked as synced to Skylight
          </p>
        </div>
      )}

      {/* Milestones List */}
      {selectedMilestones.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">No milestones planned for this week.</p>
          <div className="flex justify-center gap-3">
            <button onClick={handleAutoSuggest} className="btn btn-primary">
              Auto-Suggest Milestones
            </button>
            <button onClick={() => setShowAddMilestone(true)} className="btn btn-secondary">
              Add Manually
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedMilestones).map(([subjectId, subjectMilestones]) => {
            const subject = getSubjectById(subjectId)
            return (
              <div key={subjectId} className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{subject?.name}</h2>
                <div className="space-y-3">
                  {subjectMilestones.map((milestone) => {
                    const resources = allResources[milestone.id] || []
                    return (
                      <div
                        key={milestone.id}
                        className={`p-4 rounded-lg border-l-4 ${
                          milestone.status === 'completed'
                            ? 'bg-green-50 border-l-green-500'
                            : 'bg-gray-50 border-l-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={milestone.status === 'completed'}
                            onChange={() => handleToggleComplete(milestone)}
                            className="mt-1 h-5 w-5 rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500"
                          />
                          <div className="flex-1">
                            <h3
                              className={`font-medium ${
                                milestone.status === 'completed'
                                  ? 'text-gray-400 line-through'
                                  : 'text-gray-900'
                              }`}
                            >
                              {milestone.title}
                            </h3>
                            <p className="text-sm text-gray-500">{milestone.description}</p>

                            {/* Star Value */}
                            <div className="no-print flex items-center gap-2 mt-2">
                              <span className="text-yellow-500 text-lg">⭐</span>
                              <input
                                type="number"
                                min={1}
                                max={10}
                                value={milestone.starValue}
                                onChange={(e) =>
                                  handleStarValueChange(milestone.id, parseInt(e.target.value) || 1)
                                }
                                className="w-14 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-fuchsia-500 focus:border-fuchsia-500"
                              />
                              <span className="text-xs text-gray-400">stars</span>
                            </div>

                            {/* Resources */}
                            <div className="mt-3 space-y-1">
                              {resources.map((resource) => (
                                <div
                                  key={resource.id}
                                  className="flex items-center gap-2 text-sm bg-white p-2 rounded border"
                                >
                                  <span>{resource.type === 'url' ? '🔗' : '📄'}</span>
                                  <button
                                    onClick={() => handleOpenResource(resource)}
                                    className="text-blue-600 hover:underline flex-1 text-left truncate"
                                  >
                                    {resource.title}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteResource(resource.id)}
                                    className="no-print text-red-400 hover:text-red-600 text-xs"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => openAddResource(milestone.id)}
                                className="no-print text-xs text-fuchsia-600 hover:text-fuchsia-700 mt-1"
                              >
                                + Add Resource
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveMilestone(milestone.id)}
                            className="no-print text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Print Actions - hide on print */}
      {selectedMilestones.length > 0 && (
        <div className="no-print card mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Ready to go?</h3>
              <p className="text-sm text-gray-500">
                Print your weekly plan or open all resources at once.
              </p>
            </div>
            <div className="flex gap-3">
              {totalResources > 0 && (
                <button onClick={handleOpenAllResources} className="btn btn-secondary">
                  Open All Resources ({totalResources})
                </button>
              )}
              <button onClick={handlePrint} className="btn btn-primary">
                Print Weekly Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Milestone Modal */}
      <Dialog
        open={showAddMilestone}
        onClose={() => setShowAddMilestone(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
              Add Milestone to Week
            </Dialog.Title>

            {availableMilestones.length === 0 ? (
              <p className="text-gray-500">
                All available milestones have been added or completed.
              </p>
            ) : (
              <div className="space-y-2">
                {availableMilestones.map((milestone) => {
                  const subject = getSubjectById(milestone.subjectId)
                  return (
                    <button
                      key={milestone.id}
                      onClick={() => handleAddMilestone(milestone.id)}
                      className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 bg-fuchsia-50 text-fuchsia-600 rounded-full">
                          {subject?.name}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            milestone.status === 'in_progress'
                              ? 'bg-amber-100 text-amber-600'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {milestone.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900 mt-1">{milestone.title}</h3>
                    </button>
                  )
                })}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button onClick={() => setShowAddMilestone(false)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Add Resource Modal */}
      <Dialog
        open={showAddResource}
        onClose={() => setShowAddResource(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
              Add Resource
            </Dialog.Title>

            <Tab.Group>
              <Tab.List className="flex gap-2 mb-4">
                <Tab
                  className={({ selected }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium ${
                      selected ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-gray-100 text-gray-600'
                    }`
                  }
                >
                  URL / Link
                </Tab>
                <Tab
                  className={({ selected }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium ${
                      selected ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-gray-100 text-gray-600'
                    }`
                  }
                >
                  Upload File
                </Tab>
              </Tab.List>
              <Tab.Panels>
                <Tab.Panel className="space-y-4">
                  <div>
                    <label className="label">Title</label>
                    <input
                      type="text"
                      value={urlForm.title}
                      onChange={(e) => setUrlForm({ ...urlForm, title: e.target.value })}
                      className="input"
                      placeholder="e.g., ABC Mouse - Counting Games"
                    />
                  </div>
                  <div>
                    <label className="label">URL</label>
                    <input
                      type="url"
                      value={urlForm.url}
                      onChange={(e) => setUrlForm({ ...urlForm, url: e.target.value })}
                      className="input"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddResource(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button onClick={handleAddUrl} className="btn btn-primary">
                      Add URL
                    </button>
                  </div>
                </Tab.Panel>
                <Tab.Panel className="space-y-4">
                  <div>
                    <label className="label">Title (optional)</label>
                    <input
                      type="text"
                      value={fileTitle}
                      onChange={(e) => setFileTitle(e.target.value)}
                      className="input"
                      placeholder="Leave blank to use filename"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddResource(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button onClick={handleUploadFile} className="btn btn-primary">
                      Choose File...
                    </button>
                  </div>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  )
}
