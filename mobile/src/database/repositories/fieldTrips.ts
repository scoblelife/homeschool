import { v4 as uuid } from 'uuid'
import { getDatabase } from '../connection'
import type { FieldTrip, CreateFieldTrip, UpdateFieldTrip, FieldTripStatus, EventActivityType } from '../../types'

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
    studentIds: JSON.parse(row.student_ids as string) as string[],
    subjectIds: JSON.parse(row.subject_ids as string) as string[],
    cost: row.cost as number | undefined,
    websiteUrl: row.website_url as string | undefined,
    notes: row.notes as string | undefined,
    learningOutcomes: row.learning_outcomes as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

interface FieldTripFilters {
  studentId?: string
  status?: FieldTripStatus
  activityType?: EventActivityType
}

export async function getFieldTrips(filters?: FieldTripFilters): Promise<FieldTrip[]> {
  const db = await getDatabase()

  let query = 'SELECT * FROM field_trips WHERE 1=1'
  const params: (string | number | null)[] = []

  if (filters?.status) {
    query += ' AND status = ?'
    params.push(filters.status)
  }
  if (filters?.activityType) {
    query += ' AND activity_type = ?'
    params.push(filters.activityType)
  }

  query += ' ORDER BY date DESC'

  const rows = await db.getAllAsync(query, ...params) as Record<string, unknown>[]
  let trips = rows.map(rowToFieldTrip)

  // Filter by studentId if provided (need to check JSON array)
  if (filters?.studentId) {
    trips = trips.filter((trip) => trip.studentIds.includes(filters.studentId!))
  }

  return trips
}

export async function getFieldTrip(id: string): Promise<FieldTrip | null> {
  const db = await getDatabase()
  const row = await db.getFirstAsync('SELECT * FROM field_trips WHERE id = ?', id)
  return row ? rowToFieldTrip(row as Record<string, unknown>) : null
}

export async function createFieldTrip(data: CreateFieldTrip): Promise<FieldTrip> {
  const db = await getDatabase()
  const id = uuid()
  const now = new Date().toISOString()

  await db.runAsync(
    `INSERT INTO field_trips (id, title, activity_type, location, description, date, start_time, end_time,
       status, student_ids, subject_ids, cost, website_url, notes, learning_outcomes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.title,
    data.activityType,
    data.location,
    data.description ?? null,
    data.date,
    data.startTime ?? null,
    data.endTime ?? null,
    data.status,
    JSON.stringify(data.studentIds),
    JSON.stringify(data.subjectIds),
    data.cost ?? null,
    data.websiteUrl ?? null,
    data.notes ?? null,
    data.learningOutcomes ?? null,
    now,
    now
  )

  return (await getFieldTrip(id))!
}

export async function updateFieldTrip(id: string, data: UpdateFieldTrip): Promise<FieldTrip> {
  const db = await getDatabase()
  const now = new Date().toISOString()

  const current = await getFieldTrip(id)
  if (!current) throw new Error(`Field trip ${id} not found`)

  const updated = { ...current, ...data, updatedAt: now }

  await db.runAsync(
    `UPDATE field_trips SET title = ?, activity_type = ?, location = ?, description = ?, date = ?,
       start_time = ?, end_time = ?, status = ?, student_ids = ?, subject_ids = ?, cost = ?,
       website_url = ?, notes = ?, learning_outcomes = ?, updated_at = ?
     WHERE id = ?`,
    updated.title,
    updated.activityType,
    updated.location,
    updated.description ?? null,
    updated.date,
    updated.startTime ?? null,
    updated.endTime ?? null,
    updated.status,
    JSON.stringify(updated.studentIds),
    JSON.stringify(updated.subjectIds),
    updated.cost ?? null,
    updated.websiteUrl ?? null,
    updated.notes ?? null,
    updated.learningOutcomes ?? null,
    now,
    id
  )

  return (await getFieldTrip(id))!
}

export async function deleteFieldTrip(id: string): Promise<void> {
  const db = await getDatabase()
  await db.runAsync('DELETE FROM field_trips WHERE id = ?', id)
}

export async function getUpcomingFieldTrips(studentId?: string, limit = 5): Promise<FieldTrip[]> {
  const db = await getDatabase()
  const today = new Date().toISOString().split('T')[0]

  const rows = await db.getAllAsync(
    `SELECT * FROM field_trips
     WHERE status = 'planned' AND date >= ?
     ORDER BY date ASC
     LIMIT ?`,
    today,
    limit
  ) as Record<string, unknown>[]

  let trips = rows.map(rowToFieldTrip)

  if (studentId) {
    trips = trips.filter((trip) => trip.studentIds.includes(studentId))
  }

  return trips
}
