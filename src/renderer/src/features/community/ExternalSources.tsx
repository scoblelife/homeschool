import { useState, useEffect, useCallback } from 'react'
import { Dialog } from '@headlessui/react'
import { format, parseISO } from 'date-fns'
import { useStore } from '../../stores/useStore'
import type {
  ExternalEventSource,
  ExternalEvent,
  CreateExternalEventSource,
  CreateExternalEvent,
  ExternalSourceType
} from '../../../../shared/types'

const sourceTypeInfo: Record<ExternalSourceType, { label: string; icon: string; description: string }> = {
  facebook: { label: 'Facebook Group', icon: 'fb', description: 'Link to a Facebook group for events' },
  skool: { label: 'Skool Community', icon: 'sk', description: 'Link to a Skool.com community' },
  ical: { label: 'iCal Feed', icon: 'cal', description: 'Subscribe to an iCal/ICS calendar feed' },
  manual: { label: 'Manual Entry', icon: 'pen', description: 'Manually add events as you find them' }
}

/**
 * Render the External Sources management UI for viewing, adding, deleting, and importing external event sources and their events.
 *
 * The component fetches sources and events, shows loading state, displays per-source event lists, and exposes modals to add sources, add events (for manual sources), and import events into field trips for selected students.
 *
 * @returns The rendered React element tree for the ExternalSources interface.
 */
export function ExternalSources() {
  const { students } = useStore()
  const [sources, setSources] = useState<ExternalEventSource[]>([])
  const [events, setEvents] = useState<ExternalEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddSource, setShowAddSource] = useState(false)
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null)
  const [importingEventId, setImportingEventId] = useState<string | null>(null)
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])

  const [sourceForm, setSourceForm] = useState<CreateExternalEventSource>({
    coopGroupId: null,
    sourceType: 'manual',
    sourceName: '',
    sourceUrl: null,
    syncEnabled: true
  })

  const [eventForm, setEventForm] = useState<Omit<CreateExternalEvent, 'sourceId'>>({
    title: '',
    description: null,
    location: null,
    eventDate: format(new Date(), 'yyyy-MM-dd'),
    startTime: null,
    endTime: null,
    eventUrl: null
  })

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const sourcesData = await window.api.getExternalEventSources()
      setSources(sourcesData)
      const eventsData = await window.api.getExternalEvents()
      setEvents(eventsData)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sourceForm.sourceName) return

    await window.api.createExternalEventSource(sourceForm)
    setShowAddSource(false)
    setSourceForm({
      coopGroupId: null,
      sourceType: 'manual',
      sourceName: '',
      sourceUrl: null,
      syncEnabled: true
    })
    loadData()
  }

  const handleDeleteSource = async (id: string) => {
    if (!confirm('Delete this source and all its events?')) return
    await window.api.deleteExternalEventSource(id)
    loadData()
  }

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSourceId || !eventForm.title || !eventForm.eventDate) return

    await window.api.createExternalEvent({
      sourceId: selectedSourceId,
      ...eventForm
    })
    setShowAddEvent(false)
    setEventForm({
      title: '',
      description: null,
      location: null,
      eventDate: format(new Date(), 'yyyy-MM-dd'),
      startTime: null,
      endTime: null,
      eventUrl: null
    })
    loadData()
  }

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Delete this event?')) return
    await window.api.deleteExternalEvent(id)
    loadData()
  }

  const handleImportToFieldTrip = async (eventId: string) => {
    if (selectedStudentIds.length === 0) return
    await window.api.importExternalEventToFieldTrip(eventId, selectedStudentIds)
    setImportingEventId(null)
    setSelectedStudentIds([])
    loadData()
  }

  const getSourceEvents = (sourceId: string) => events.filter(e => e.sourceId === sourceId)

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-600 dark:border-fuchsia-400" />
        <p className="mt-4 text-gray-500 dark:text-gray-400">Loading community sources...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">External Event Sources</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Connect to Facebook groups, Skool communities, or add events manually
          </p>
        </div>
        <button onClick={() => setShowAddSource(true)} className="btn btn-primary">
          + Add Source
        </button>
      </div>

      {/* Sources List */}
      {sources.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No community sources added yet. Connect your co-op's Facebook group or Skool community to see events here.
          </p>
          <button onClick={() => setShowAddSource(true)} className="btn btn-primary">
            Add Your First Source
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sources.map(source => (
            <div key={source.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    source.sourceType === 'facebook' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' :
                    source.sourceType === 'skool' ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400' :
                    source.sourceType === 'ical' ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400' :
                    'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {source.sourceType === 'facebook' && 'FB'}
                    {source.sourceType === 'skool' && 'SK'}
                    {source.sourceType === 'ical' && 'Cal'}
                    {source.sourceType === 'manual' && '+'}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{source.sourceName}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {sourceTypeInfo[source.sourceType].label}
                      {source.sourceUrl && (
                        <a
                          href={source.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-fuchsia-600 dark:text-fuchsia-400 hover:underline"
                        >
                          Open Link
                        </a>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {source.sourceType === 'manual' && (
                    <button
                      onClick={() => {
                        setSelectedSourceId(source.id)
                        setShowAddEvent(true)
                      }}
                      className="btn btn-secondary text-sm"
                    >
                      + Add Event
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteSource(source.id)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Events for this source */}
              {getSourceEvents(source.id).length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                    Events ({getSourceEvents(source.id).length})
                  </h4>
                  <div className="space-y-2">
                    {getSourceEvents(source.id).map(event => (
                      <div
                        key={event.id}
                        className={`p-3 rounded-lg ${
                          event.importedToFieldTripId
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                            : 'bg-gray-50 dark:bg-gray-700/50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{event.title}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {format(parseISO(event.eventDate), 'MMM d, yyyy')}
                              {event.startTime && ` at ${event.startTime}`}
                              {event.location && ` - ${event.location}`}
                            </div>
                            {event.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{event.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {event.eventUrl && (
                              <a
                                href={event.eventUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-fuchsia-600 dark:text-fuchsia-400 hover:underline text-sm"
                              >
                                Link
                              </a>
                            )}
                            {event.importedToFieldTripId ? (
                              <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded">
                                Imported
                              </span>
                            ) : (
                              <button
                                onClick={() => setImportingEventId(event.id)}
                                className="text-fuchsia-600 dark:text-fuchsia-400 hover:text-fuchsia-700 dark:hover:text-fuchsia-300 text-sm"
                              >
                                Import
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              className="text-red-400 hover:text-red-600 text-sm"
                            >
                              x
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Source Modal */}
      <Dialog open={showAddSource} onClose={() => setShowAddSource(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add Community Source
            </Dialog.Title>

            <form onSubmit={handleAddSource} className="space-y-4">
              <div>
                <label className="label">Source Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(sourceTypeInfo) as ExternalSourceType[]).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSourceForm({ ...sourceForm, sourceType: type })}
                      className={`p-3 rounded-lg text-left transition-colors ${
                        sourceForm.sourceType === type
                          ? 'bg-fuchsia-100 dark:bg-fuchsia-900/50 ring-2 ring-fuchsia-500'
                          : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-white text-sm">
                        {sourceTypeInfo[type].label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {sourceTypeInfo[type].description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Name</label>
                <input
                  type="text"
                  value={sourceForm.sourceName}
                  onChange={e => setSourceForm({ ...sourceForm, sourceName: e.target.value })}
                  className="input"
                  placeholder="e.g., Local Homeschool Co-op"
                  required
                />
              </div>

              {sourceForm.sourceType !== 'manual' && (
                <div>
                  <label className="label">
                    {sourceForm.sourceType === 'facebook' && 'Facebook Group URL'}
                    {sourceForm.sourceType === 'skool' && 'Skool Community URL'}
                    {sourceForm.sourceType === 'ical' && 'iCal Feed URL'}
                  </label>
                  <input
                    type="url"
                    value={sourceForm.sourceUrl || ''}
                    onChange={e => setSourceForm({ ...sourceForm, sourceUrl: e.target.value || null })}
                    className="input"
                    placeholder={
                      sourceForm.sourceType === 'facebook' ? 'https://facebook.com/groups/...' :
                      sourceForm.sourceType === 'skool' ? 'https://skool.com/...' :
                      'https://calendar.google.com/calendar/ical/...'
                    }
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowAddSource(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Source
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Add Event Modal */}
      <Dialog open={showAddEvent} onClose={() => setShowAddEvent(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add Event
            </Dialog.Title>

            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="label">Event Title</label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                  className="input"
                  placeholder="e.g., Park Day at Memorial Park"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Date</label>
                  <input
                    type="date"
                    value={eventForm.eventDate}
                    onChange={e => setEventForm({ ...eventForm, eventDate: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Time (optional)</label>
                  <input
                    type="time"
                    value={eventForm.startTime || ''}
                    onChange={e => setEventForm({ ...eventForm, startTime: e.target.value || null })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Location (optional)</label>
                <input
                  type="text"
                  value={eventForm.location || ''}
                  onChange={e => setEventForm({ ...eventForm, location: e.target.value || null })}
                  className="input"
                  placeholder="e.g., Memorial Park, 123 Main St"
                />
              </div>

              <div>
                <label className="label">Event Link (optional)</label>
                <input
                  type="url"
                  value={eventForm.eventUrl || ''}
                  onChange={e => setEventForm({ ...eventForm, eventUrl: e.target.value || null })}
                  className="input"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="label">Description (optional)</label>
                <textarea
                  value={eventForm.description || ''}
                  onChange={e => setEventForm({ ...eventForm, description: e.target.value || null })}
                  className="input"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowAddEvent(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Event
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Import to Field Trip Modal */}
      <Dialog open={!!importingEventId} onClose={() => setImportingEventId(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Import to Field Trips
            </Dialog.Title>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Select which students will attend this event:
            </p>

            <div className="space-y-2 mb-6">
              {students.map(student => (
                <label key={student.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.includes(student.id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedStudentIds([...selectedStudentIds, student.id])
                      } else {
                        setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id))
                      }
                    }}
                    className="rounded border-gray-300 dark:border-gray-600 text-fuchsia-600"
                  />
                  <span className="text-gray-900 dark:text-white">{student.name}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setImportingEventId(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={() => importingEventId && handleImportToFieldTrip(importingEventId)}
                disabled={selectedStudentIds.length === 0}
                className="btn btn-primary disabled:opacity-50"
              >
                Import Event
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  )
}