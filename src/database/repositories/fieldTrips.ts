import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../connection'
import type {
  FieldTrip,
  CreateFieldTrip,
  UpdateFieldTrip,
  FieldTripStatus,
  EventActivityType,
  ActivityTask,
  CreateActivityTask,
  UpdateActivityTask,
  TaskPhase,
  ActivityContact,
  CreateActivityContact,
  UpdateActivityContact,
  ContactRole,
  ActivityRSVP,
  CreateActivityRSVP,
  UpdateActivityRSVP,
  RSVPStatus,
  ActivityExpense,
  CreateActivityExpense,
  UpdateActivityExpense,
  ExpenseCategory,
  ActivityPayment,
  CreateActivityPayment,
  UpdateActivityPayment,
  PaymentStatus,
  FieldTripActivity,
  CreateFieldTripActivity
} from '../../shared/types'

function rowToFieldTrip(row: Record<string, unknown>): FieldTrip {
  return {
    id: row.id as string,
    title: row.title as string,
    activityType: (row.activity_type as EventActivityType) || 'field_trip',
    location: row.location as string,
    description: row.description as string | undefined,
    date: row.date as string,
    startTime: row.start_time as string | undefined,
    endTime: row.end_time as string | undefined,
    status: row.status as FieldTripStatus,
    studentIds: JSON.parse((row.student_ids as string) || '[]'),
    subjectIds: JSON.parse((row.subject_ids as string) || '[]'),
    cost: row.cost as number | undefined,
    websiteUrl: row.website_url as string | undefined,
    notes: row.notes as string | undefined,
    learningOutcomes: row.learning_outcomes as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  }
}

function rowToActivityTask(row: Record<string, unknown>): ActivityTask {
  return {
    id: row.id as string,
    activityId: row.activity_id as string,
    title: row.title as string,
    description: row.description as string | undefined,
    phase: row.phase as TaskPhase,
    assignedTo: row.assigned_to as string | undefined,
    dueDate: row.due_date as string | undefined,
    completedAt: row.completed_at as string | undefined,
    sortOrder: row.sort_order as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  }
}

export async function getFieldTrips(filters?: {
  studentId?: string
  status?: FieldTripStatus
  activityType?: EventActivityType
}): Promise<FieldTrip[]> {
  const db = await getDatabase()

  let query = 'SELECT * FROM field_trips'
  const conditions: string[] = []
  const params: unknown[] = []

  if (filters?.status) {
    conditions.push('status = ?')
    params.push(filters.status)
  }

  if (filters?.activityType) {
    conditions.push('activity_type = ?')
    params.push(filters.activityType)
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ')
  }

  query += ' ORDER BY date DESC'

  const rows = await db.all(query, ...params)
  let trips = rows.map(rowToFieldTrip)

  // Filter by student ID in memory (since it's stored as JSON array)
  if (filters?.studentId) {
    trips = trips.filter((trip) => trip.studentIds.includes(filters.studentId!))
  }

  return trips
}

export async function getFieldTrip(id: string): Promise<FieldTrip | null> {
  const db = await getDatabase()
  const rows = await db.all('SELECT * FROM field_trips WHERE id = ?', id)
  return rows.length > 0 ? rowToFieldTrip(rows[0]) : null
}

export async function createFieldTrip(data: CreateFieldTrip): Promise<FieldTrip> {
  const db = await getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  await db.run(
    `INSERT INTO field_trips (id, title, activity_type, location, description, date, start_time, end_time, status, student_ids, subject_ids, cost, website_url, notes, learning_outcomes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.title,
    data.activityType || 'field_trip',
    data.location,
    data.description || null,
    data.date,
    data.startTime || null,
    data.endTime || null,
    data.status,
    JSON.stringify(data.studentIds),
    JSON.stringify(data.subjectIds),
    data.cost || null,
    data.websiteUrl || null,
    data.notes || null,
    data.learningOutcomes || null,
    now,
    now
  )

  return (await getFieldTrip(id))!
}

export async function updateFieldTrip(id: string, data: UpdateFieldTrip): Promise<FieldTrip> {
  const db = await getDatabase()
  const existing = await getFieldTrip(id)
  if (!existing) throw new Error(`Field trip ${id} not found`)

  const updated = { ...existing, ...data, updatedAt: new Date().toISOString() }

  await db.run(
    `UPDATE field_trips SET title = ?, activity_type = ?, location = ?, description = ?, date = ?, start_time = ?, end_time = ?, status = ?, student_ids = ?, subject_ids = ?, cost = ?, website_url = ?, notes = ?, learning_outcomes = ?, updated_at = ?
     WHERE id = ?`,
    updated.title,
    updated.activityType,
    updated.location,
    updated.description || null,
    updated.date,
    updated.startTime || null,
    updated.endTime || null,
    updated.status,
    JSON.stringify(updated.studentIds),
    JSON.stringify(updated.subjectIds),
    updated.cost || null,
    updated.websiteUrl || null,
    updated.notes || null,
    updated.learningOutcomes || null,
    updated.updatedAt,
    id
  )

  return (await getFieldTrip(id))!
}

export async function deleteFieldTrip(id: string): Promise<void> {
  const db = await getDatabase()
  // Tasks are deleted via CASCADE, but let's be explicit
  await db.run('DELETE FROM activity_tasks WHERE activity_id = ?', id)
  await db.run('DELETE FROM field_trips WHERE id = ?', id)
}

// ============================================
// Activity Tasks
// ============================================

export async function getActivityTasks(activityId: string): Promise<ActivityTask[]> {
  const db = await getDatabase()
  const rows = await db.all(
    'SELECT * FROM activity_tasks WHERE activity_id = ? ORDER BY phase, sort_order, created_at',
    activityId
  )
  return rows.map(rowToActivityTask)
}

export async function getActivityTask(id: string): Promise<ActivityTask | null> {
  const db = await getDatabase()
  const rows = await db.all('SELECT * FROM activity_tasks WHERE id = ?', id)
  return rows.length > 0 ? rowToActivityTask(rows[0]) : null
}

export async function createActivityTask(data: CreateActivityTask): Promise<ActivityTask> {
  const db = await getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  // Get next sort order for this phase
  const maxOrder = await db.all(
    'SELECT MAX(sort_order) as max FROM activity_tasks WHERE activity_id = ? AND phase = ?',
    data.activityId,
    data.phase
  )
  const sortOrder = data.sortOrder ?? ((maxOrder[0]?.max as number | null) ?? -1) + 1

  await db.run(
    `INSERT INTO activity_tasks (id, activity_id, title, description, phase, assigned_to, due_date, completed_at, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.activityId,
    data.title,
    data.description || null,
    data.phase,
    data.assignedTo || null,
    data.dueDate || null,
    data.completedAt || null,
    sortOrder,
    now,
    now
  )

  return (await getActivityTask(id))!
}

export async function updateActivityTask(id: string, data: UpdateActivityTask): Promise<ActivityTask> {
  const db = await getDatabase()
  const existing = await getActivityTask(id)
  if (!existing) throw new Error(`Activity task ${id} not found`)

  const updated = { ...existing, ...data, updatedAt: new Date().toISOString() }

  await db.run(
    `UPDATE activity_tasks SET title = ?, description = ?, phase = ?, assigned_to = ?, due_date = ?, completed_at = ?, sort_order = ?, updated_at = ?
     WHERE id = ?`,
    updated.title,
    updated.description || null,
    updated.phase,
    updated.assignedTo || null,
    updated.dueDate || null,
    updated.completedAt || null,
    updated.sortOrder,
    updated.updatedAt,
    id
  )

  return (await getActivityTask(id))!
}

export async function deleteActivityTask(id: string): Promise<void> {
  const db = await getDatabase()
  await db.run('DELETE FROM activity_tasks WHERE id = ?', id)
}

export async function toggleActivityTask(id: string): Promise<ActivityTask> {
  const db = await getDatabase()
  const existing = await getActivityTask(id)
  if (!existing) throw new Error(`Activity task ${id} not found`)

  const now = new Date().toISOString()
  const completedAt = existing.completedAt ? null : now

  await db.run(
    `UPDATE activity_tasks SET completed_at = ?, updated_at = ? WHERE id = ?`,
    completedAt,
    now,
    id
  )

  return (await getActivityTask(id))!
}

// ============================================
// Activity Contacts
// ============================================

function rowToActivityContact(row: Record<string, unknown>): ActivityContact {
  return {
    id: row.id as string,
    activityId: row.activity_id as string,
    name: row.name as string,
    role: row.role as ContactRole | undefined,
    phone: row.phone as string | undefined,
    email: row.email as string | undefined,
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string
  }
}

export async function getActivityContacts(activityId: string): Promise<ActivityContact[]> {
  const db = await getDatabase()
  const rows = await db.all(
    'SELECT * FROM activity_contacts WHERE activity_id = ? ORDER BY created_at',
    activityId
  )
  return rows.map(rowToActivityContact)
}

export async function getActivityContact(id: string): Promise<ActivityContact | null> {
  const db = await getDatabase()
  const rows = await db.all('SELECT * FROM activity_contacts WHERE id = ?', id)
  return rows.length > 0 ? rowToActivityContact(rows[0]) : null
}

export async function createActivityContact(data: CreateActivityContact): Promise<ActivityContact> {
  const db = await getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  await db.run(
    `INSERT INTO activity_contacts (id, activity_id, name, role, phone, email, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.activityId,
    data.name,
    data.role || null,
    data.phone || null,
    data.email || null,
    data.notes || null,
    now
  )

  return (await getActivityContact(id))!
}

export async function updateActivityContact(id: string, data: UpdateActivityContact): Promise<ActivityContact> {
  const db = await getDatabase()
  const existing = await getActivityContact(id)
  if (!existing) throw new Error(`Activity contact ${id} not found`)

  const updated = { ...existing, ...data }

  await db.run(
    `UPDATE activity_contacts SET name = ?, role = ?, phone = ?, email = ?, notes = ?
     WHERE id = ?`,
    updated.name,
    updated.role || null,
    updated.phone || null,
    updated.email || null,
    updated.notes || null,
    id
  )

  return (await getActivityContact(id))!
}

export async function deleteActivityContact(id: string): Promise<void> {
  const db = await getDatabase()
  await db.run('DELETE FROM activity_contacts WHERE id = ?', id)
}

// ============================================
// Activity RSVPs
// ============================================

function rowToActivityRSVP(row: Record<string, unknown>): ActivityRSVP {
  return {
    id: row.id as string,
    activityId: row.activity_id as string,
    familyName: row.family_name as string,
    attendingCount: row.attending_count as number,
    status: row.status as RSVPStatus,
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  }
}

export async function getActivityRSVPs(activityId: string): Promise<ActivityRSVP[]> {
  const db = await getDatabase()
  const rows = await db.all(
    'SELECT * FROM activity_rsvps WHERE activity_id = ? ORDER BY family_name',
    activityId
  )
  return rows.map(rowToActivityRSVP)
}

export async function getActivityRSVP(id: string): Promise<ActivityRSVP | null> {
  const db = await getDatabase()
  const rows = await db.all('SELECT * FROM activity_rsvps WHERE id = ?', id)
  return rows.length > 0 ? rowToActivityRSVP(rows[0]) : null
}

export async function createActivityRSVP(data: CreateActivityRSVP): Promise<ActivityRSVP> {
  const db = await getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  await db.run(
    `INSERT INTO activity_rsvps (id, activity_id, family_name, attending_count, status, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.activityId,
    data.familyName,
    data.attendingCount || 0,
    data.status,
    data.notes || null,
    now,
    now
  )

  return (await getActivityRSVP(id))!
}

export async function updateActivityRSVP(id: string, data: UpdateActivityRSVP): Promise<ActivityRSVP> {
  const db = await getDatabase()
  const existing = await getActivityRSVP(id)
  if (!existing) throw new Error(`Activity RSVP ${id} not found`)

  const updated = { ...existing, ...data, updatedAt: new Date().toISOString() }

  await db.run(
    `UPDATE activity_rsvps SET family_name = ?, attending_count = ?, status = ?, notes = ?, updated_at = ?
     WHERE id = ?`,
    updated.familyName,
    updated.attendingCount,
    updated.status,
    updated.notes || null,
    updated.updatedAt,
    id
  )

  return (await getActivityRSVP(id))!
}

export async function deleteActivityRSVP(id: string): Promise<void> {
  const db = await getDatabase()
  await db.run('DELETE FROM activity_rsvps WHERE id = ?', id)
}

// ============================================
// Activity Expenses
// ============================================

function rowToActivityExpense(row: Record<string, unknown>): ActivityExpense {
  return {
    id: row.id as string,
    activityId: row.activity_id as string,
    description: row.description as string,
    amount: row.amount as number,
    category: row.category as ExpenseCategory | undefined,
    paidBy: row.paid_by as string | undefined,
    expenseDate: row.expense_date as string | undefined,
    createdAt: row.created_at as string
  }
}

export async function getActivityExpenses(activityId: string): Promise<ActivityExpense[]> {
  const db = await getDatabase()
  const rows = await db.all(
    'SELECT * FROM activity_expenses WHERE activity_id = ? ORDER BY expense_date DESC, created_at DESC',
    activityId
  )
  return rows.map(rowToActivityExpense)
}

export async function getActivityExpense(id: string): Promise<ActivityExpense | null> {
  const db = await getDatabase()
  const rows = await db.all('SELECT * FROM activity_expenses WHERE id = ?', id)
  return rows.length > 0 ? rowToActivityExpense(rows[0]) : null
}

export async function createActivityExpense(data: CreateActivityExpense): Promise<ActivityExpense> {
  const db = await getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  await db.run(
    `INSERT INTO activity_expenses (id, activity_id, description, amount, category, paid_by, expense_date, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.activityId,
    data.description,
    data.amount,
    data.category || null,
    data.paidBy || null,
    data.expenseDate || null,
    now
  )

  return (await getActivityExpense(id))!
}

export async function updateActivityExpense(id: string, data: UpdateActivityExpense): Promise<ActivityExpense> {
  const db = await getDatabase()
  const existing = await getActivityExpense(id)
  if (!existing) throw new Error(`Activity expense ${id} not found`)

  const updated = { ...existing, ...data }

  await db.run(
    `UPDATE activity_expenses SET description = ?, amount = ?, category = ?, paid_by = ?, expense_date = ?
     WHERE id = ?`,
    updated.description,
    updated.amount,
    updated.category || null,
    updated.paidBy || null,
    updated.expenseDate || null,
    id
  )

  return (await getActivityExpense(id))!
}

export async function deleteActivityExpense(id: string): Promise<void> {
  const db = await getDatabase()
  await db.run('DELETE FROM activity_expenses WHERE id = ?', id)
}

// ============================================
// Activity Payments
// ============================================

function rowToActivityPayment(row: Record<string, unknown>): ActivityPayment {
  return {
    id: row.id as string,
    activityId: row.activity_id as string,
    familyName: row.family_name as string,
    amount: row.amount as number,
    status: row.status as PaymentStatus,
    paidDate: row.paid_date as string | undefined,
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  }
}

export async function getActivityPayments(activityId: string): Promise<ActivityPayment[]> {
  const db = await getDatabase()
  const rows = await db.all(
    'SELECT * FROM activity_payments WHERE activity_id = ? ORDER BY family_name',
    activityId
  )
  return rows.map(rowToActivityPayment)
}

export async function getActivityPayment(id: string): Promise<ActivityPayment | null> {
  const db = await getDatabase()
  const rows = await db.all('SELECT * FROM activity_payments WHERE id = ?', id)
  return rows.length > 0 ? rowToActivityPayment(rows[0]) : null
}

export async function createActivityPayment(data: CreateActivityPayment): Promise<ActivityPayment> {
  const db = await getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  await db.run(
    `INSERT INTO activity_payments (id, activity_id, family_name, amount, status, paid_date, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.activityId,
    data.familyName,
    data.amount,
    data.status,
    data.paidDate || null,
    data.notes || null,
    now,
    now
  )

  return (await getActivityPayment(id))!
}

export async function updateActivityPayment(id: string, data: UpdateActivityPayment): Promise<ActivityPayment> {
  const db = await getDatabase()
  const existing = await getActivityPayment(id)
  if (!existing) throw new Error(`Activity payment ${id} not found`)

  const updated = { ...existing, ...data, updatedAt: new Date().toISOString() }

  await db.run(
    `UPDATE activity_payments SET family_name = ?, amount = ?, status = ?, paid_date = ?, notes = ?, updated_at = ?
     WHERE id = ?`,
    updated.familyName,
    updated.amount,
    updated.status,
    updated.paidDate || null,
    updated.notes || null,
    updated.updatedAt,
    id
  )

  return (await getActivityPayment(id))!
}

export async function deleteActivityPayment(id: string): Promise<void> {
  const db = await getDatabase()
  await db.run('DELETE FROM activity_payments WHERE id = ?', id)
}

// ============================================
// Duplicate Activity
// ============================================

export interface DuplicateActivityOptions {
  newDate: string
  copyTasks?: boolean
  copyContacts?: boolean
}

export async function duplicateActivity(
  id: string,
  options: DuplicateActivityOptions
): Promise<FieldTrip> {
  const existing = await getFieldTrip(id)
  if (!existing) throw new Error(`Activity ${id} not found`)

  // Create the new activity
  const newActivity = await createFieldTrip({
    title: existing.title,
    activityType: existing.activityType,
    location: existing.location,
    description: existing.description,
    date: options.newDate,
    startTime: existing.startTime,
    endTime: existing.endTime,
    status: 'planned', // Reset status to planned
    studentIds: existing.studentIds,
    subjectIds: existing.subjectIds,
    cost: existing.cost,
    websiteUrl: existing.websiteUrl,
    notes: existing.notes,
    learningOutcomes: existing.learningOutcomes
  })

  // Copy tasks (reset to incomplete)
  if (options.copyTasks) {
    const tasks = await getActivityTasks(id)
    for (const task of tasks) {
      await createActivityTask({
        activityId: newActivity.id,
        title: task.title,
        description: task.description,
        phase: task.phase,
        assignedTo: task.assignedTo,
        sortOrder: task.sortOrder
        // Don't copy dueDate or completedAt
      })
    }
  }

  // Copy contacts
  if (options.copyContacts) {
    const contacts = await getActivityContacts(id)
    for (const contact of contacts) {
      await createActivityContact({
        activityId: newActivity.id,
        name: contact.name,
        role: contact.role,
        phone: contact.phone,
        email: contact.email,
        notes: contact.notes
      })
    }
  }

  // Don't copy RSVPs, expenses, or payments (date-specific)

  return newActivity
}

// ============================================================================
// Field Trip Activity Linking
// ============================================================================

function rowToFieldTripActivity(row: Record<string, unknown>): FieldTripActivity {
  return {
    id: row.id as string,
    fieldTripId: row.field_trip_id as string,
    activityId: row.activity_id as string,
    createdAt: row.created_at as string
  }
}

export async function linkActivityToFieldTrip(
  data: CreateFieldTripActivity
): Promise<FieldTripActivity> {
  const db = await getDatabase()
  const id = uuidv4()

  await db.run(
    `INSERT INTO field_trip_activities (id, field_trip_id, activity_id)
     VALUES (?, ?, ?)`,
    id,
    data.fieldTripId,
    data.activityId
  )

  const rows = await db.all<Record<string, unknown>>(
    'SELECT * FROM field_trip_activities WHERE id = ?',
    id
  )
  return rowToFieldTripActivity(rows[0])
}

export async function unlinkActivityFromFieldTrip(
  fieldTripId: string,
  activityId: string
): Promise<void> {
  const db = await getDatabase()
  await db.run(
    'DELETE FROM field_trip_activities WHERE field_trip_id = ? AND activity_id = ?',
    fieldTripId,
    activityId
  )
}

export async function getLinkedActivities(
  fieldTripId: string
): Promise<FieldTripActivity[]> {
  const db = await getDatabase()
  const rows = await db.all<Record<string, unknown>>(
    'SELECT * FROM field_trip_activities WHERE field_trip_id = ? ORDER BY created_at DESC',
    fieldTripId
  )
  return rows.map(rowToFieldTripActivity)
}

export async function getFieldTripsForActivity(
  activityId: string
): Promise<FieldTripActivity[]> {
  const db = await getDatabase()
  const rows = await db.all<Record<string, unknown>>(
    'SELECT * FROM field_trip_activities WHERE activity_id = ? ORDER BY created_at DESC',
    activityId
  )
  return rows.map(rowToFieldTripActivity)
}
