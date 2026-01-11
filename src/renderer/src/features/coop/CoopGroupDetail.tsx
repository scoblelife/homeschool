import { useState, useEffect, useCallback } from 'react'
import { Dialog } from '@headlessui/react'
import { format, parseISO, isFuture, isPast, isToday } from 'date-fns'
import type { CoopGroup, CoopMember, CoopEvent, CreateCoopEvent } from '../../../../shared/types'

interface CoopGroupDetailProps {
  group: CoopGroup
  onBack: () => void
  onGroupDeleted: () => void
}

export function CoopGroupDetail({ group, onBack, onGroupDeleted }: CoopGroupDetailProps) {
  const [members, setMembers] = useState<CoopMember[]>([])
  const [events, setEvents] = useState<CoopEvent[]>([])
  const [activeTab, setActiveTab] = useState<'events' | 'members'>('events')
  const [showEventModal, setShowEventModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  // Event form state
  const [eventTitle, setEventTitle] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [eventDate, setEventDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [eventStartTime, setEventStartTime] = useState('')
  const [eventEndTime, setEventEndTime] = useState('')
  const [eventMaxAttendees, setEventMaxAttendees] = useState('')

  const loadData = useCallback(async () => {
    try {
      const [membersData, eventsData] = await Promise.all([
        window.api.getCoopMembers(group.id),
        window.api.getCoopEvents(group.id)
      ])
      setMembers(membersData)
      setEvents(eventsData)
    } catch (error) {
      console.error('Failed to load group data:', error)
    }
  }, [group.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(group.inviteCode)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    } catch (error) {
      console.error('Failed to copy code:', error)
    }
  }

  const handleCreateEvent = async () => {
    if (!eventTitle.trim() || !eventLocation.trim() || !eventDate) return

    // Find current user's member ID (first organizer or first member)
    const currentMember = members.find(m => m.role === 'organizer') || members[0]
    if (!currentMember) return

    try {
      await window.api.createCoopEvent({
        groupId: group.id,
        title: eventTitle.trim(),
        description: eventDescription.trim() || undefined,
        location: eventLocation.trim(),
        date: eventDate,
        startTime: eventStartTime || undefined,
        endTime: eventEndTime || undefined,
        organizerId: currentMember.id,
        maxAttendees: eventMaxAttendees ? parseInt(eventMaxAttendees, 10) : undefined
      })

      // Reset form
      setEventTitle('')
      setEventDescription('')
      setEventLocation('')
      setEventDate(format(new Date(), 'yyyy-MM-dd'))
      setEventStartTime('')
      setEventEndTime('')
      setEventMaxAttendees('')
      setShowEventModal(false)
      await loadData()
    } catch (error) {
      console.error('Failed to create event:', error)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return
    try {
      await window.api.deleteCoopEvent(eventId)
      await loadData()
    } catch (error) {
      console.error('Failed to delete event:', error)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return
    try {
      await window.api.deleteCoopMember(memberId)
      await loadData()
    } catch (error) {
      console.error('Failed to remove member:', error)
    }
  }

  const handleDeleteGroup = async () => {
    try {
      await window.api.deleteCoopGroup(group.id)
      onGroupDeleted()
    } catch (error) {
      console.error('Failed to delete group:', error)
    }
  }

  const upcomingEvents = events.filter(e => isFuture(parseISO(e.date)) || isToday(parseISO(e.date)))
  const pastEvents = events.filter(e => isPast(parseISO(e.date)) && !isToday(parseISO(e.date)))

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button
            onClick={onBack}
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center gap-1 mb-2"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Back to Groups
          </button>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{group.name}</h2>
          {group.description && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">{group.description}</p>
          )}
        </div>

        {/* Invite Code */}
        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Invite Code</p>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <span className="font-mono text-lg tracking-widest text-gray-900 dark:text-white">
              {group.inviteCode}
            </span>
            {copiedCode ? (
              <CheckIcon className="w-4 h-4 text-green-600" />
            ) : (
              <CopyIcon className="w-4 h-4 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('events')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'events'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          Events ({events.length})
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'members'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          Members ({members.length})
        </button>
      </div>

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-900 dark:text-white">Upcoming Events</h3>
            <button
              onClick={() => setShowEventModal(true)}
              className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Add Event
            </button>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg mb-6">
              <CalendarIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400">No upcoming events</p>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  members={members}
                  onDelete={() => handleDeleteEvent(event.id)}
                />
              ))}
            </div>
          )}

          {pastEvents.length > 0 && (
            <>
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">Past Events</h3>
              <div className="space-y-3 opacity-60">
                {pastEvents.slice(0, 5).map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    members={members}
                    onDelete={() => handleDeleteEvent(event.id)}
                    isPast
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div>
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${member.role === 'organizer' ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                    <UserIcon className={`w-5 h-5 ${member.role === 'organizer' ? 'text-amber-600' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{member.familyName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{member.role}</p>
                  </div>
                </div>
                {member.role !== 'organizer' && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove member"
                  >
                    <XIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Delete Group
            </button>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      <Dialog open={showEventModal} onClose={() => setShowEventModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Create Event
            </Dialog.Title>

            <div className="space-y-4">
              <div>
                <label className="label">Event Title *</label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g., Park Day at Oak Grove"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Location *</label>
                <input
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="e.g., Oak Grove Park, 123 Main St"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Date *</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Max Attendees</label>
                  <input
                    type="number"
                    value={eventMaxAttendees}
                    onChange={(e) => setEventMaxAttendees(e.target.value)}
                    placeholder="Optional"
                    min="1"
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Time</label>
                  <input
                    type="time"
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">End Time</label>
                  <input
                    type="time"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="Add details about the event..."
                  rows={3}
                  className="input"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEventModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEvent}
                disabled={!eventTitle.trim() || !eventLocation.trim() || !eventDate}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Event
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Delete Group?
            </Dialog.Title>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This will permanently delete the group, all members, and all events. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGroup}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Group
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  )
}

// Event Card Component
function EventCard({
  event,
  members,
  onDelete,
  isPast = false
}: {
  event: CoopEvent
  members: CoopMember[]
  onDelete: () => void
  isPast?: boolean
}) {
  const organizer = members.find(m => m.id === event.organizerId)

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 dark:text-white truncate">{event.title}</h4>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 dark:text-gray-400">
            <span>{format(parseISO(event.date), 'EEEE, MMM d')}</span>
            {event.startTime && (
              <>
                <span>-</span>
                <span>{event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}</span>
              </>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{event.location}</p>
          {organizer && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Organized by {organizer.familyName}
            </p>
          )}
        </div>
        {!isPast && (
          <button
            onClick={onDelete}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="Delete event"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// Icons
function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
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

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}
