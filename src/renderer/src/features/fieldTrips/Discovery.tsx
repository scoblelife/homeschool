import { useState, useEffect, useCallback, useMemo } from 'react'
import { format, parseISO, isToday, isTomorrow, isThisWeek, isThisMonth } from 'date-fns'
import type { CoopEvent } from '../../../../shared/types'

type ExtendedCoopEvent = CoopEvent & { groupName: string; organizerName: string }

type TimeFilter = 'all' | 'today' | 'week' | 'month'

export function FieldTripDiscovery() {
  const [events, setEvents] = useState<ExtendedCoopEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [selectedGroup, setSelectedGroup] = useState<string>('all')

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true)
      const data = await window.api.getAllUpcomingCoopEvents()
      setEvents(data)
    } catch (error) {
      console.error('Failed to load events:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  // Get unique group names for filter dropdown
  const groupNames = useMemo(() => {
    const names = new Set(events.map(e => e.groupName))
    return Array.from(names).sort()
  }, [events])

  // Filter events based on search, time, and group
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          event.title.toLowerCase().includes(query) ||
          event.location.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.groupName.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Time filter
      if (timeFilter !== 'all') {
        const eventDate = parseISO(event.date)
        switch (timeFilter) {
          case 'today':
            if (!isToday(eventDate)) return false
            break
          case 'week':
            if (!isThisWeek(eventDate)) return false
            break
          case 'month':
            if (!isThisMonth(eventDate)) return false
            break
        }
      }

      // Group filter
      if (selectedGroup !== 'all' && event.groupName !== selectedGroup) {
        return false
      }

      return true
    })
  }, [events, searchQuery, timeFilter, selectedGroup])

  // Group events by date for display
  const groupedEvents = useMemo(() => {
    const groups: { [key: string]: ExtendedCoopEvent[] } = {}
    filteredEvents.forEach(event => {
      const dateKey = event.date
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(event)
    })
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [filteredEvents])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-gray-500 dark:text-gray-400">Loading events...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Discover Field Trips</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Browse upcoming events from your co-op groups
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events, locations..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Time Filter */}
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
        >
          <option value="all">All upcoming</option>
          <option value="today">Today</option>
          <option value="week">This week</option>
          <option value="month">This month</option>
        </select>

        {/* Group Filter */}
        {groupNames.length > 1 && (
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
          >
            <option value="all">All groups</option>
            {groupNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Events */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {events.length === 0 ? 'No upcoming events' : 'No matching events'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            {events.length === 0
              ? 'Join a co-op group to see field trips and events from other families.'
              : 'Try adjusting your search or filters to find more events.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedEvents.map(([dateKey, dateEvents]) => (
            <div key={dateKey}>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                {formatDateHeading(dateKey)}
              </h3>
              <div className="space-y-3">
                {dateEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {filteredEvents.length > 0 && (
        <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredEvents.length} of {events.length} events
        </div>
      )}
    </div>
  )
}

function EventCard({ event }: { event: ExtendedCoopEvent }) {
  const handleAddToCalendar = async () => {
    try {
      // Check if Google Calendar is available
      const hasCredentials = await window.api.hasGoogleCredentials()
      if (!hasCredentials) {
        alert('Connect Google Calendar in Settings to add events to your calendar.')
        return
      }

      // TODO: Add event to Google Calendar
      alert('Calendar integration coming soon!')
    } catch (error) {
      console.error('Failed to add to calendar:', error)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-fuchsia-300 dark:hover:border-fuchsia-600 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Title and Group */}
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900 dark:text-white truncate">{event.title}</h4>
            <span className="px-2 py-0.5 text-xs bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-300 rounded-full whitespace-nowrap">
              {event.groupName}
            </span>
          </div>

          {/* Time */}
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <ClockIcon className="w-4 h-4" />
              {event.startTime || 'Time TBD'}
              {event.endTime && ` - ${event.endTime}`}
            </span>
            {event.maxAttendees && (
              <span className="flex items-center gap-1">
                <UsersIcon className="w-4 h-4" />
                Max {event.maxAttendees}
              </span>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mt-1">
            <MapPinIcon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>

          {/* Description */}
          {event.description && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2 line-clamp-2">
              {event.description}
            </p>
          )}

          {/* Organizer */}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Organized by {event.organizerName}
          </p>
        </div>

        {/* Actions */}
        <div className="ml-4 flex flex-col gap-2">
          <button
            onClick={handleAddToCalendar}
            className="p-2 text-gray-400 hover:text-fuchsia-500 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/30 rounded-lg transition-colors"
            title="Add to calendar"
          >
            <CalendarPlusIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function formatDateHeading(dateKey: string): string {
  const date = parseISO(dateKey)
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  return format(date, 'EEEE, MMMM d')
}

// Icons
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function CalendarPlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2zM12 11v6m-3-3h6" />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

export default FieldTripDiscovery
