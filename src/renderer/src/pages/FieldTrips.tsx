import { useState, useEffect, useMemo } from 'react'
import { Dialog } from '@headlessui/react'
import { format, parseISO, isPast, isFuture, isToday, addDays } from 'date-fns'

// Helper to handle dates that might be Date objects or strings from DuckDB
const toDate = (date: string | Date): Date => {
  if (date instanceof Date) return date
  return parseISO(date)
}
import { useStore } from '../stores/useStore'
import type {
  FieldTrip,
  CreateFieldTrip,
  FieldTripStatus,
  EventActivityType,
  ActivityTask,
  CreateActivityTask,
  TaskPhase,
  ActivityContact,
  CreateActivityContact,
  ContactRole,
  ActivityRSVP,
  CreateActivityRSVP,
  RSVPStatus,
  ActivityExpense,
  CreateActivityExpense,
  ExpenseCategory
} from '../../../shared/types'

type StatusFilter = 'all' | 'planned' | 'completed' | 'cancelled'

const statusLabels: Record<FieldTripStatus, { label: string; color: string; bg: string }> = {
  planned: { label: 'Planned', color: 'text-blue-600', bg: 'bg-blue-100' },
  completed: { label: 'Completed', color: 'text-green-600', bg: 'bg-green-100' },
  cancelled: { label: 'Cancelled', color: 'text-gray-600', bg: 'bg-gray-100' }
}

const activityTypeConfig: Record<EventActivityType, { icon: string; label: string; color: string; bg: string }> = {
  field_trip: { icon: '🚌', label: 'Field Trip', color: 'text-amber-700', bg: 'bg-amber-100' },
  park_day: { icon: '🌳', label: 'Park Day', color: 'text-green-700', bg: 'bg-green-100' },
  game_night: { icon: '🎲', label: 'Game Night', color: 'text-purple-700', bg: 'bg-purple-100' },
  playdate: { icon: '👋', label: 'Playdate', color: 'text-pink-700', bg: 'bg-pink-100' },
  coop_class: { icon: '📚', label: 'Co-op Class', color: 'text-blue-700', bg: 'bg-blue-100' },
  custom: { icon: '📅', label: 'Other', color: 'text-gray-700', bg: 'bg-gray-100' }
}

const phaseLabels: Record<TaskPhase, { label: string; icon: string }> = {
  pre: { label: 'Before', icon: '📋' },
  day_of: { label: 'Day Of', icon: '📍' },
  post: { label: 'After', icon: '✨' }
}

const contactRoleLabels: Record<ContactRole, string> = {
  venue: 'Venue',
  organizer: 'Organizer',
  emergency: 'Emergency',
  other: 'Other'
}

const rsvpStatusLabels: Record<RSVPStatus, { label: string; color: string; bg: string }> = {
  invited: { label: 'Invited', color: 'text-gray-600', bg: 'bg-gray-100' },
  confirmed: { label: 'Confirmed', color: 'text-green-600', bg: 'bg-green-100' },
  declined: { label: 'Declined', color: 'text-red-600', bg: 'bg-red-100' },
  maybe: { label: 'Maybe', color: 'text-amber-600', bg: 'bg-amber-100' }
}

// Activity types that show RSVP section (group events)
const groupActivityTypes: EventActivityType[] = ['park_day', 'game_night', 'coop_class']

const expenseCategoryLabels: Record<ExpenseCategory, { label: string; icon: string }> = {
  admission: { label: 'Admission', icon: '🎟️' },
  food: { label: 'Food', icon: '🍕' },
  supplies: { label: 'Supplies', icon: '📦' },
  transportation: { label: 'Transportation', icon: '🚗' },
  other: { label: 'Other', icon: '📝' }
}

function FieldTripCard({
  trip,
  students,
  subjects,
  onEdit,
  onDelete,
  onDuplicate,
  onStatusChange,
  isExpanded,
  onToggleExpand,
  tasks,
  newTaskTitle,
  newTaskPhase,
  onNewTaskTitleChange,
  onNewTaskPhaseChange,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  contacts,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  rsvps,
  onAddRSVP,
  onUpdateRSVP,
  onDeleteRSVP,
  expenses,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense
}: {
  trip: FieldTrip
  students: { id: string; name: string }[]
  subjects: { id: string; name: string }[]
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
  onStatusChange: (status: FieldTripStatus) => void
  isExpanded: boolean
  onToggleExpand: () => void
  tasks: ActivityTask[]
  newTaskTitle: string
  newTaskPhase: TaskPhase
  onNewTaskTitleChange: (title: string) => void
  onNewTaskPhaseChange: (phase: TaskPhase) => void
  onAddTask: () => void
  onToggleTask: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
  contacts: ActivityContact[]
  onAddContact: (contact: Omit<CreateActivityContact, 'activityId'>) => void
  onUpdateContact: (id: string, data: Partial<Omit<CreateActivityContact, 'activityId'>>) => void
  onDeleteContact: (id: string) => void
  rsvps: ActivityRSVP[]
  onAddRSVP: (rsvp: Omit<CreateActivityRSVP, 'activityId'>) => void
  onUpdateRSVP: (id: string, status: RSVPStatus) => void
  onDeleteRSVP: (id: string) => void
  expenses: ActivityExpense[]
  onAddExpense: (expense: Omit<CreateActivityExpense, 'activityId'>) => void
  onUpdateExpense: (id: string, data: Partial<Omit<CreateActivityExpense, 'activityId'>>) => void
  onDeleteExpense: (id: string) => void
}) {
  const statusInfo = statusLabels[trip.status]
  const activityConfig = activityTypeConfig[trip.activityType] || activityTypeConfig.field_trip
  const tripDate = toDate(trip.date)
  const isUpcoming = isFuture(tripDate) || isToday(tripDate)
  const isPastTrip = isPast(tripDate) && !isToday(tripDate)
  const showRSVP = groupActivityTypes.includes(trip.activityType)

  const tripStudents = students.filter((s) => trip.studentIds.includes(s.id))
  const tripSubjects = subjects.filter((s) => trip.subjectIds.includes(s.id))

  // Local state for contact form
  const [showContactForm, setShowContactForm] = useState(false)
  const [newContactName, setNewContactName] = useState('')
  const [newContactRole, setNewContactRole] = useState<ContactRole>('venue')
  const [newContactPhone, setNewContactPhone] = useState('')
  const [newContactEmail, setNewContactEmail] = useState('')
  const [newContactNotes, setNewContactNotes] = useState('')

  // Local state for RSVP form
  const [showRSVPForm, setShowRSVPForm] = useState(false)
  const [newRSVPName, setNewRSVPName] = useState('')
  const [newRSVPCount, setNewRSVPCount] = useState(1)

  const handleAddContact = () => {
    if (!newContactName.trim()) return
    onAddContact({
      name: newContactName.trim(),
      role: newContactRole,
      phone: newContactPhone.trim() || undefined,
      email: newContactEmail.trim() || undefined,
      notes: newContactNotes.trim() || undefined
    })
    setNewContactName('')
    setNewContactPhone('')
    setNewContactEmail('')
    setNewContactNotes('')
    setShowContactForm(false)
  }

  const handleAddRSVP = () => {
    if (!newRSVPName.trim()) return
    onAddRSVP({
      familyName: newRSVPName.trim(),
      attendingCount: newRSVPCount,
      status: 'invited'
    })
    setNewRSVPName('')
    setNewRSVPCount(1)
    setShowRSVPForm(false)
  }

  // Calculate RSVP summary
  const rsvpSummary = useMemo(() => {
    const confirmed = rsvps.filter((r) => r.status === 'confirmed')
    const totalAttending = confirmed.reduce((sum, r) => sum + r.attendingCount, 0)
    return { confirmed: confirmed.length, totalAttending }
  }, [rsvps])

  // Local state for expense form
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [newExpenseDesc, setNewExpenseDesc] = useState('')
  const [newExpenseAmount, setNewExpenseAmount] = useState('')
  const [newExpenseCategory, setNewExpenseCategory] = useState<ExpenseCategory>('other')

  const handleAddExpense = () => {
    if (!newExpenseDesc.trim() || !newExpenseAmount) return
    onAddExpense({
      description: newExpenseDesc.trim(),
      amount: parseFloat(newExpenseAmount),
      category: newExpenseCategory
    })
    setNewExpenseDesc('')
    setNewExpenseAmount('')
    setShowExpenseForm(false)
  }

  // Calculate expense summary
  const expenseTotal = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0)
  }, [expenses])

  return (
    <div
      className={`p-4 rounded-lg border-l-4 ${
        trip.status === 'completed'
          ? 'bg-green-50 border-l-green-500'
          : trip.status === 'cancelled'
            ? 'bg-gray-50 border-l-gray-300'
            : isUpcoming
              ? 'bg-blue-50 border-l-blue-500'
              : 'bg-amber-50 border-l-amber-500'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm px-2 py-0.5 rounded-full ${activityConfig.bg} ${activityConfig.color}`}>
              {activityConfig.icon} {activityConfig.label}
            </span>
            <h3 className="font-medium text-gray-900">{trip.title}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 flex-wrap">
            <span>📍 {trip.location}</span>
            <span>•</span>
            <span>📅 {format(tripDate, 'EEEE, MMMM d, yyyy')}</span>
            {(trip.startTime || trip.endTime) && (
              <>
                <span>•</span>
                <span>🕐 {trip.startTime || '?'}{trip.endTime ? ` - ${trip.endTime}` : ''}</span>
              </>
            )}
            {trip.cost && (
              <>
                <span>•</span>
                <span>💰 ${trip.cost.toFixed(2)}</span>
              </>
            )}
          </div>

          {trip.description && (
            <p className="text-sm text-gray-600 mt-2">{trip.description}</p>
          )}

          {/* Students */}
          <div className="mt-3 flex flex-wrap gap-2">
            {tripStudents.map((student) => (
              <span
                key={student.id}
                className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700"
              >
                {student.name}
              </span>
            ))}
          </div>

          {/* Subjects */}
          <div className="mt-2 flex flex-wrap gap-2">
            {tripSubjects.map((subject) => (
              <span
                key={subject.id}
                className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700"
              >
                {subject.name}
              </span>
            ))}
          </div>

          {/* Website */}
          {trip.websiteUrl && (
            <a
              href={trip.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-sm text-blue-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              🔗 Visit Website
            </a>
          )}

          {/* Learning Outcomes */}
          {trip.learningOutcomes && (
            <div className="mt-3 p-2 bg-white/50 rounded text-sm">
              <strong className="text-gray-700">Learning Outcomes:</strong>
              <p className="text-gray-600 mt-1">{trip.learningOutcomes}</p>
            </div>
          )}

          {/* Notes */}
          {trip.notes && (
            <p className="text-sm text-gray-500 mt-2 italic">Notes: {trip.notes}</p>
          )}

          {/* Alert for past unfinished activities */}
          {isPastTrip && trip.status === 'planned' && (
            <p className="text-sm text-amber-600 mt-2">
              ⚠️ This activity date has passed. Update the status to completed or cancelled.
            </p>
          )}

          {/* Task progress indicator */}
          <button
            onClick={onToggleExpand}
            className="mt-3 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <span>{isExpanded ? '▼' : '▶'}</span>
            <span>
              Tasks: {tasks.filter((t) => t.completedAt).length}/{tasks.length}
            </span>
            {tasks.length > 0 && (
              <div className="flex-1 max-w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{
                    width: `${tasks.length > 0 ? (tasks.filter((t) => t.completedAt).length / tasks.length) * 100 : 0}%`
                  }}
                />
              </div>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={trip.status}
            onChange={(e) => onStatusChange(e.target.value as FieldTripStatus)}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1"
          >
            <option value="planned">Planned</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button onClick={onEdit} className="text-indigo-600 hover:text-indigo-800 text-sm">
            Edit
          </button>
          <button onClick={onDuplicate} className="text-gray-600 hover:text-gray-800 text-sm">
            Duplicate
          </button>
          <button onClick={onDelete} className="text-red-500 hover:text-red-700 text-sm">
            Delete
          </button>
        </div>
      </div>

      {/* Expandable Tasks Section */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          {/* Add Task Form */}
          <div className="flex gap-2 mb-4">
            <select
              value={newTaskPhase}
              onChange={(e) => onNewTaskPhaseChange(e.target.value as TaskPhase)}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1.5"
            >
              {(Object.entries(phaseLabels) as [TaskPhase, typeof phaseLabels.pre][]).map(
                ([phase, config]) => (
                  <option key={phase} value={phase}>
                    {config.icon} {config.label}
                  </option>
                )
              )}
            </select>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => onNewTaskTitleChange(e.target.value)}
              placeholder="Add a task..."
              className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5"
              onKeyDown={(e) => e.key === 'Enter' && onAddTask()}
            />
            <button
              onClick={onAddTask}
              disabled={!newTaskTitle.trim()}
              className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              Add
            </button>
          </div>

          {/* Tasks by Phase */}
          {(['pre', 'day_of', 'post'] as TaskPhase[]).map((phase) => {
            const phaseTasks = tasks.filter((t) => t.phase === phase)
            if (phaseTasks.length === 0) return null

            const phaseConfig = phaseLabels[phase]
            return (
              <div key={phase} className="mb-3">
                <div className="text-xs font-medium text-gray-500 mb-1">
                  {phaseConfig.icon} {phaseConfig.label}
                </div>
                <div className="space-y-1">
                  {phaseTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 p-2 bg-white/50 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={!!task.completedAt}
                        onChange={() => onToggleTask(task.id)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span
                        className={`flex-1 text-sm ${task.completedAt ? 'line-through text-gray-400' : 'text-gray-700'}`}
                      >
                        {task.title}
                      </span>
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="text-gray-400 hover:text-red-500 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {tasks.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-2">
              No tasks yet. Add tasks to track preparation steps.
            </p>
          )}

          {/* Contacts Section */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-700">📞 Contacts</div>
              <button
                onClick={() => setShowContactForm(!showContactForm)}
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                {showContactForm ? 'Cancel' : '+ Add'}
              </button>
            </div>

            {showContactForm && (
              <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200 space-y-2">
                <input
                  type="text"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="Contact name"
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newContactRole}
                    onChange={(e) => setNewContactRole(e.target.value as ContactRole)}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    {(Object.entries(contactRoleLabels) as [ContactRole, string][]).map(
                      ([role, label]) => (
                        <option key={role} value={role}>
                          {label}
                        </option>
                      )
                    )}
                  </select>
                  <input
                    type="tel"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    placeholder="Phone"
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  />
                </div>
                <input
                  type="email"
                  value={newContactEmail}
                  onChange={(e) => setNewContactEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                />
                <input
                  type="text"
                  value={newContactNotes}
                  onChange={(e) => setNewContactNotes(e.target.value)}
                  placeholder="Website URL or notes"
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                />
                <button
                  onClick={handleAddContact}
                  disabled={!newContactName.trim()}
                  className="w-full py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  Add Contact
                </button>
              </div>
            )}

            {contacts.length > 0 ? (
              <div className="space-y-2">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="p-2 bg-white/50 rounded"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-700">{contact.name}</div>
                      <button
                        onClick={() => onDeleteContact(contact.id)}
                        className="text-gray-400 hover:text-red-500 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <select
                        value={contact.role || 'other'}
                        onChange={(e) => onUpdateContact(contact.id, { role: e.target.value as ContactRole })}
                        className="text-xs border border-gray-200 rounded px-1.5 py-0.5 bg-white"
                      >
                        {(Object.entries(contactRoleLabels) as [ContactRole, string][]).map(
                          ([role, label]) => (
                            <option key={role} value={role}>{label}</option>
                          )
                        )}
                      </select>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                      {contact.phone && (
                        <div>📞 <a href={`tel:${contact.phone}`} className="hover:text-indigo-600">{contact.phone}</a></div>
                      )}
                      {contact.email && (
                        <div>✉️ <a href={`mailto:${contact.email}`} className="hover:text-indigo-600">{contact.email}</a></div>
                      )}
                      {contact.notes && (
                        <div>
                          {contact.notes.startsWith('http') ? (
                            <>🔗 <a href={contact.notes} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600">{contact.notes}</a></>
                          ) : (
                            <>📝 {contact.notes}</>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !showContactForm && (
                <p className="text-xs text-gray-400 text-center py-1">
                  No contacts added
                </p>
              )
            )}
          </div>

          {/* RSVP Section - Only for group events */}
          {showRSVP && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-700">
                  📝 RSVPs
                  {rsvps.length > 0 && (
                    <span className="ml-2 text-xs text-gray-500">
                      ({rsvpSummary.confirmed} confirmed, {rsvpSummary.totalAttending} attending)
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowRSVPForm(!showRSVPForm)}
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  {showRSVPForm ? 'Cancel' : '+ Add'}
                </button>
              </div>

              {showRSVPForm && (
                <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200 space-y-2">
                  <input
                    type="text"
                    value={newRSVPName}
                    onChange={(e) => setNewRSVPName(e.target.value)}
                    placeholder="Family name"
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                  />
                  <div className="flex gap-2 items-center">
                    <label className="text-xs text-gray-600">Attending:</label>
                    <input
                      type="number"
                      value={newRSVPCount}
                      onChange={(e) => setNewRSVPCount(parseInt(e.target.value) || 1)}
                      min="1"
                      className="w-16 text-sm border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                  <button
                    onClick={handleAddRSVP}
                    disabled={!newRSVPName.trim()}
                    className="w-full py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Add RSVP
                  </button>
                </div>
              )}

              {rsvps.length > 0 ? (
                <div className="space-y-2">
                  {rsvps.map((rsvp) => {
                    const statusInfo = rsvpStatusLabels[rsvp.status]
                    return (
                      <div
                        key={rsvp.id}
                        className="flex items-center justify-between p-2 bg-white/50 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="text-sm font-medium text-gray-700">
                              {rsvp.familyName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {rsvp.attendingCount} {rsvp.attendingCount === 1 ? 'person' : 'people'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={rsvp.status}
                            onChange={(e) => onUpdateRSVP(rsvp.id, e.target.value as RSVPStatus)}
                            className={`text-xs rounded px-2 py-1 border-0 ${statusInfo.bg} ${statusInfo.color}`}
                          >
                            {(Object.entries(rsvpStatusLabels) as [RSVPStatus, typeof statusInfo][]).map(
                              ([status, info]) => (
                                <option key={status} value={status}>
                                  {info.label}
                                </option>
                              )
                            )}
                          </select>
                          <button
                            onClick={() => onDeleteRSVP(rsvp.id)}
                            className="text-gray-400 hover:text-red-500 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                !showRSVPForm && (
                  <p className="text-xs text-gray-400 text-center py-1">
                    No RSVPs yet. Add families to track attendance.
                  </p>
                )
              )}
            </div>
          )}

          {/* Expenses Section */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-700">
                💰 Expenses
                {expenses.length > 0 && (
                  <span className="ml-2 text-xs text-gray-500">
                    (Total: ${expenseTotal.toFixed(2)})
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowExpenseForm(!showExpenseForm)}
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                {showExpenseForm ? 'Cancel' : '+ Add'}
              </button>
            </div>

            {showExpenseForm && (
              <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200 space-y-2">
                <input
                  type="text"
                  value={newExpenseDesc}
                  onChange={(e) => setNewExpenseDesc(e.target.value)}
                  placeholder="Description"
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={newExpenseAmount}
                    onChange={(e) => setNewExpenseAmount(e.target.value)}
                    placeholder="Amount"
                    min="0"
                    step="0.01"
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  />
                  <select
                    value={newExpenseCategory}
                    onChange={(e) => setNewExpenseCategory(e.target.value as ExpenseCategory)}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    {(Object.entries(expenseCategoryLabels) as [ExpenseCategory, { label: string; icon: string }][]).map(
                      ([cat, config]) => (
                        <option key={cat} value={cat}>
                          {config.icon} {config.label}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <button
                  onClick={handleAddExpense}
                  disabled={!newExpenseDesc.trim() || !newExpenseAmount}
                  className="w-full py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  Add Expense
                </button>
              </div>
            )}

            {expenses.length > 0 ? (
              <div className="space-y-2">
                {expenses.map((expense) => {
                  const catConfig = expense.category
                    ? expenseCategoryLabels[expense.category]
                    : expenseCategoryLabels.other
                  return (
                    <div
                      key={expense.id}
                      className="p-2 bg-white/50 rounded"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-700">
                          {expense.description}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">
                            ${expense.amount.toFixed(2)}
                          </span>
                          <button
                            onClick={() => onDeleteExpense(expense.id)}
                            className="text-gray-400 hover:text-red-500 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <select
                          value={expense.category || 'other'}
                          onChange={(e) => onUpdateExpense(expense.id, { category: e.target.value as ExpenseCategory })}
                          className="text-xs border border-gray-200 rounded px-1.5 py-0.5 bg-white"
                        >
                          {(Object.entries(expenseCategoryLabels) as [ExpenseCategory, { label: string; icon: string }][]).map(
                            ([cat, config]) => (
                              <option key={cat} value={cat}>{config.icon} {config.label}</option>
                            )
                          )}
                        </select>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              !showExpenseForm && (
                <p className="text-xs text-gray-400 text-center py-1">
                  No expenses recorded yet.
                </p>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function FieldTrips(): JSX.Element {
  const { students, subjects, selectedStudentId } = useStore()
  const [trips, setTrips] = useState<FieldTrip[]>([])
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all')
  const [showAddTrip, setShowAddTrip] = useState(false)
  const [editingTrip, setEditingTrip] = useState<FieldTrip | null>(null)
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null)
  const [tasks, setTasks] = useState<Record<string, ActivityTask[]>>({})
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskPhase, setNewTaskPhase] = useState<TaskPhase>('pre')
  const [contacts, setContacts] = useState<Record<string, ActivityContact[]>>({})
  const [rsvps, setRSVPs] = useState<Record<string, ActivityRSVP[]>>({})
  const [expenses, setExpenses] = useState<Record<string, ActivityExpense[]>>({})

  // Duplicate modal state
  const [duplicatingTrip, setDuplicatingTrip] = useState<FieldTrip | null>(null)
  const [duplicateDate, setDuplicateDate] = useState('')
  const [duplicateCopyTasks, setDuplicateCopyTasks] = useState(true)
  const [duplicateCopyContacts, setDuplicateCopyContacts] = useState(true)

  const [formData, setFormData] = useState<CreateFieldTrip>({
    title: '',
    activityType: 'field_trip',
    location: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '',
    endTime: '',
    status: 'planned',
    studentIds: [],
    subjectIds: [],
    cost: undefined,
    websiteUrl: '',
    notes: '',
    learningOutcomes: ''
  })

  const loadTrips = async () => {
    const data = await window.api.getFieldTrips(
      selectedStudentId ? { studentId: selectedStudentId } : undefined
    )
    setTrips(data)
    // Load task counts for all activities
    const taskPromises = data.map(async (trip) => {
      const activityTasks = await window.api.getActivityTasks(trip.id)
      return { id: trip.id, tasks: activityTasks }
    })
    const allTasks = await Promise.all(taskPromises)
    const tasksMap: Record<string, ActivityTask[]> = {}
    allTasks.forEach(({ id, tasks: t }) => {
      tasksMap[id] = t
    })
    setTasks(tasksMap)
  }

  useEffect(() => {
    loadTrips()
  }, [selectedStudentId])

  const filteredTrips = useMemo(() => {
    let filtered = trips

    if (filterStatus !== 'all') {
      filtered = filtered.filter((t) => t.status === filterStatus)
    }

    // Sort by date, upcoming first, then past
    return filtered.sort((a, b) => {
      const dateA = toDate(a.date)
      const dateB = toDate(b.date)
      const nowDate = new Date()

      // Upcoming trips first
      const aIsUpcoming = dateA >= nowDate
      const bIsUpcoming = dateB >= nowDate

      if (aIsUpcoming && !bIsUpcoming) return -1
      if (!aIsUpcoming && bIsUpcoming) return 1

      // Within same category, sort by date
      if (aIsUpcoming && bIsUpcoming) {
        return dateA.getTime() - dateB.getTime() // Nearest first
      }
      return dateB.getTime() - dateA.getTime() // Most recent first
    })
  }, [trips, filterStatus])

  const stats = useMemo(() => {
    const total = trips.length
    const planned = trips.filter((t) => t.status === 'planned').length
    const completed = trips.filter((t) => t.status === 'completed').length
    const upcoming = trips.filter(
      (t) => t.status === 'planned' && (isFuture(toDate(t.date)) || isToday(toDate(t.date)))
    ).length
    return { total, planned, completed, upcoming }
  }, [trips])

  const openAddModal = () => {
    setFormData({
      title: '',
      activityType: 'field_trip',
      location: '',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: '',
      endTime: '',
      status: 'planned',
      studentIds: selectedStudentId ? [selectedStudentId] : [],
      subjectIds: [],
      cost: undefined,
      websiteUrl: '',
      notes: '',
      learningOutcomes: ''
    })
    setShowAddTrip(true)
  }

  const openEditModal = (trip: FieldTrip) => {
    setEditingTrip(trip)
    setFormData({
      title: trip.title,
      activityType: trip.activityType,
      location: trip.location,
      description: trip.description || '',
      date: trip.date,
      startTime: trip.startTime || '',
      endTime: trip.endTime || '',
      status: trip.status,
      studentIds: trip.studentIds,
      subjectIds: trip.subjectIds,
      cost: trip.cost,
      websiteUrl: trip.websiteUrl || '',
      notes: trip.notes || '',
      learningOutcomes: trip.learningOutcomes || ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.location || !formData.date) return
    if (formData.studentIds.length === 0) {
      alert('Please select at least one student')
      return
    }

    const tripData: CreateFieldTrip = {
      ...formData,
      cost: formData.cost || undefined
    }

    if (editingTrip) {
      await window.api.updateFieldTrip(editingTrip.id, tripData)
      setEditingTrip(null)
    } else {
      await window.api.createFieldTrip(tripData)
      setShowAddTrip(false)
    }

    loadTrips()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this activity?')) {
      await window.api.deleteFieldTrip(id)
      loadTrips()
    }
  }

  const handleStatusChange = async (id: string, status: FieldTripStatus) => {
    await window.api.updateFieldTrip(id, { status })
    loadTrips()
  }

  const openDuplicateModal = (trip: FieldTrip) => {
    setDuplicatingTrip(trip)
    setDuplicateDate(format(addDays(toDate(trip.date), 7), 'yyyy-MM-dd')) // Default to 1 week later
    setDuplicateCopyTasks(true)
    setDuplicateCopyContacts(true)
  }

  const handleDuplicate = async () => {
    if (!duplicatingTrip || !duplicateDate) return
    await window.api.duplicateActivity(duplicatingTrip.id, {
      newDate: duplicateDate,
      copyTasks: duplicateCopyTasks,
      copyContacts: duplicateCopyContacts
    })
    setDuplicatingTrip(null)
    loadTrips()
  }

  const loadTasks = async (activityId: string) => {
    const activityTasks = await window.api.getActivityTasks(activityId)
    setTasks((prev) => ({ ...prev, [activityId]: activityTasks }))
  }

  const toggleExpanded = async (tripId: string) => {
    if (expandedTripId === tripId) {
      setExpandedTripId(null)
    } else {
      setExpandedTripId(tripId)
      // Load all data for the expanded card
      if (!tasks[tripId]) {
        await loadTasks(tripId)
      }
      if (!contacts[tripId]) {
        await loadContacts(tripId)
      }
      if (!rsvps[tripId]) {
        await loadRSVPs(tripId)
      }
      if (!expenses[tripId]) {
        await loadExpenses(tripId)
      }
    }
  }

  const handleAddTask = async (activityId: string) => {
    if (!newTaskTitle.trim()) return
    await window.api.createActivityTask({
      activityId,
      title: newTaskTitle.trim(),
      phase: newTaskPhase,
      sortOrder: 0
    })
    setNewTaskTitle('')
    await loadTasks(activityId)
  }

  const handleToggleTask = async (taskId: string, activityId: string) => {
    await window.api.toggleActivityTask(taskId)
    await loadTasks(activityId)
  }

  const handleDeleteTask = async (taskId: string, activityId: string) => {
    await window.api.deleteActivityTask(taskId)
    await loadTasks(activityId)
  }

  // Contacts handlers
  const loadContacts = async (activityId: string) => {
    const activityContacts = await window.api.getActivityContacts(activityId)
    setContacts((prev) => ({ ...prev, [activityId]: activityContacts }))
  }

  const handleAddContact = async (activityId: string, data: Omit<CreateActivityContact, 'activityId'>) => {
    await window.api.createActivityContact({ ...data, activityId })
    await loadContacts(activityId)
  }

  const handleDeleteContact = async (contactId: string, activityId: string) => {
    await window.api.deleteActivityContact(contactId)
    await loadContacts(activityId)
  }

  const handleUpdateContact = async (
    contactId: string,
    data: Partial<Omit<CreateActivityContact, 'activityId'>>,
    activityId: string
  ) => {
    await window.api.updateActivityContact(contactId, data)
    await loadContacts(activityId)
  }

  // RSVP handlers
  const loadRSVPs = async (activityId: string) => {
    const activityRSVPs = await window.api.getActivityRSVPs(activityId)
    setRSVPs((prev) => ({ ...prev, [activityId]: activityRSVPs }))
  }

  const handleAddRSVP = async (activityId: string, data: Omit<CreateActivityRSVP, 'activityId'>) => {
    await window.api.createActivityRSVP({ ...data, activityId })
    await loadRSVPs(activityId)
  }

  const handleUpdateRSVP = async (rsvpId: string, status: RSVPStatus, activityId: string) => {
    await window.api.updateActivityRSVP(rsvpId, { status })
    await loadRSVPs(activityId)
  }

  const handleDeleteRSVP = async (rsvpId: string, activityId: string) => {
    await window.api.deleteActivityRSVP(rsvpId)
    await loadRSVPs(activityId)
  }

  // Expense handlers
  const loadExpenses = async (activityId: string) => {
    const activityExpenses = await window.api.getActivityExpenses(activityId)
    setExpenses((prev) => ({ ...prev, [activityId]: activityExpenses }))
  }

  const handleAddExpense = async (activityId: string, data: Omit<CreateActivityExpense, 'activityId'>) => {
    await window.api.createActivityExpense({ ...data, activityId })
    await loadExpenses(activityId)
  }

  const handleDeleteExpense = async (expenseId: string, activityId: string) => {
    await window.api.deleteActivityExpense(expenseId)
    await loadExpenses(activityId)
  }

  const handleUpdateExpense = async (
    expenseId: string,
    data: Partial<Omit<CreateActivityExpense, 'activityId'>>,
    activityId: string
  ) => {
    await window.api.updateActivityExpense(expenseId, data)
    await loadExpenses(activityId)
  }

  const toggleStudentSelection = (studentId: string) => {
    setFormData((prev) => ({
      ...prev,
      studentIds: prev.studentIds.includes(studentId)
        ? prev.studentIds.filter((id) => id !== studentId)
        : [...prev.studentIds, studentId]
    }))
  }

  const toggleSubjectSelection = (subjectId: string) => {
    setFormData((prev) => ({
      ...prev,
      subjectIds: prev.subjectIds.includes(subjectId)
        ? prev.subjectIds.filter((id) => id !== subjectId)
        : [...prev.subjectIds, subjectId]
    }))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
          <p className="text-sm text-gray-500 mt-1">
            Plan field trips, park days, playdates, and social events
          </p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary">
          + Plan Activity
        </button>
      </div>

      {/* Stats */}
      <div className="card mb-6">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Activities</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">{stats.upcoming}</div>
            <div className="text-sm text-gray-500">Upcoming</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600">{stats.planned}</div>
            <div className="text-sm text-gray-500">Planned</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1 mb-6">
        {(['all', 'planned', 'completed', 'cancelled'] as StatusFilter[]).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === status
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Activities List */}
      {filteredTrips.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">
            {trips.length === 0
              ? 'No activities planned yet. Start by planning your first activity!'
              : 'No activities match your filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTrips.map((trip) => (
            <FieldTripCard
              key={trip.id}
              trip={trip}
              students={students}
              subjects={subjects}
              onEdit={() => openEditModal(trip)}
              onDelete={() => handleDelete(trip.id)}
              onDuplicate={() => openDuplicateModal(trip)}
              onStatusChange={(status) => handleStatusChange(trip.id, status)}
              isExpanded={expandedTripId === trip.id}
              onToggleExpand={() => toggleExpanded(trip.id)}
              tasks={tasks[trip.id] || []}
              newTaskTitle={expandedTripId === trip.id ? newTaskTitle : ''}
              newTaskPhase={newTaskPhase}
              onNewTaskTitleChange={setNewTaskTitle}
              onNewTaskPhaseChange={setNewTaskPhase}
              onAddTask={() => handleAddTask(trip.id)}
              onToggleTask={(taskId) => handleToggleTask(taskId, trip.id)}
              onDeleteTask={(taskId) => handleDeleteTask(taskId, trip.id)}
              contacts={contacts[trip.id] || []}
              onAddContact={(data) => handleAddContact(trip.id, data)}
              onUpdateContact={(contactId, data) => handleUpdateContact(contactId, data, trip.id)}
              onDeleteContact={(contactId) => handleDeleteContact(contactId, trip.id)}
              rsvps={rsvps[trip.id] || []}
              onAddRSVP={(data) => handleAddRSVP(trip.id, data)}
              onUpdateRSVP={(rsvpId, status) => handleUpdateRSVP(rsvpId, status, trip.id)}
              onDeleteRSVP={(rsvpId) => handleDeleteRSVP(rsvpId, trip.id)}
              expenses={expenses[trip.id] || []}
              onAddExpense={(data) => handleAddExpense(trip.id, data)}
              onUpdateExpense={(expenseId, data) => handleUpdateExpense(expenseId, data, trip.id)}
              onDeleteExpense={(expenseId) => handleDeleteExpense(expenseId, trip.id)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog
        open={showAddTrip || !!editingTrip}
        onClose={() => {
          setShowAddTrip(false)
          setEditingTrip(null)
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
          <Dialog.Panel className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 my-8">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
              {editingTrip ? 'Edit Activity' : 'Plan Activity'}
            </Dialog.Title>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Activity Type Selector */}
              <div>
                <label className="label">Activity Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(activityTypeConfig) as [EventActivityType, typeof activityTypeConfig.field_trip][]).map(
                    ([type, config]) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, activityType: type })}
                        className={`p-2 rounded-lg text-center transition-all ${
                          formData.activityType === type
                            ? `${config.bg} ${config.color} ring-2 ring-offset-1 ring-current`
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <div className="text-xl">{config.icon}</div>
                        <div className="text-xs mt-1">{config.label}</div>
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="label">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                  placeholder="e.g., Science Museum Visit"
                  required
                />
              </div>

              <div>
                <label className="label">Location *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="input"
                  placeholder="e.g., Natural History Museum, 123 Main St"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="label">Estimated Cost</label>
                  <input
                    type="number"
                    value={formData.cost || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cost: e.target.value ? parseFloat(e.target.value) : undefined
                      })
                    }
                    className="input"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime || ''}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">End Time</label>
                  <input
                    type="time"
                    value={formData.endTime || ''}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Students *</label>
                <div className="flex flex-wrap gap-2">
                  {students.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => toggleStudentSelection(student.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        formData.studentIds.includes(student.id)
                          ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-500'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {student.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Related Subjects</label>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((subject) => (
                    <button
                      key={subject.id}
                      type="button"
                      onClick={() => toggleSubjectSelection(subject.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        formData.subjectIds.includes(subject.id)
                          ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {subject.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Website URL</label>
                <input
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  className="input"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="What will you see/do?"
                />
              </div>

              {editingTrip && (
                <div>
                  <label className="label">Learning Outcomes</label>
                  <textarea
                    value={formData.learningOutcomes}
                    onChange={(e) => setFormData({ ...formData, learningOutcomes: e.target.value })}
                    className="input"
                    rows={2}
                    placeholder="What did the students learn?"
                  />
                </div>
              )}

              <div>
                <label className="label">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="Parking info, what to bring, etc."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTrip(false)
                    setEditingTrip(null)
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTrip ? 'Save Changes' : 'Create Activity'}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Duplicate Modal */}
      <Dialog
        open={!!duplicatingTrip}
        onClose={() => setDuplicatingTrip(null)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
              Duplicate Activity
            </Dialog.Title>

            {duplicatingTrip && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Create a copy of <span className="font-medium">{duplicatingTrip.title}</span>
                </p>

                <div>
                  <label className="label">New Date *</label>
                  <input
                    type="date"
                    value={duplicateDate}
                    onChange={(e) => setDuplicateDate(e.target.value)}
                    className="input"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="label">Copy Options</label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={duplicateCopyTasks}
                      onChange={(e) => setDuplicateCopyTasks(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Copy tasks (will be reset to incomplete)</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={duplicateCopyContacts}
                      onChange={(e) => setDuplicateCopyContacts(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Copy contacts</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    RSVPs, expenses, and payments are not copied.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setDuplicatingTrip(null)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDuplicate}
                    disabled={!duplicateDate}
                    className="btn btn-primary"
                  >
                    Duplicate
                  </button>
                </div>
              </div>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  )
}
