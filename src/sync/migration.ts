/**
 * Sync Migration - Generate synthetic events for existing data
 *
 * When sync is first enabled, we need to create events for all existing
 * data so it can be synced to other devices.
 */

import { getDatabase } from '../database/connection'
import type { EventLog } from './eventLog'
import { createEventId } from './events'
import type {
  StudentCreatedEvent,
  ActivityLoggedEvent,
  MilestoneCreatedEvent,
  FieldTripCreatedEvent,
  BookCreatedEvent,
  WeeklyPlanCreatedEvent,
  SyncEvent
} from './events'

/**
 * Check if migration has been run
 */
export async function needsMigration(): Promise<boolean> {
  const db = await getDatabase()
  const rows = await db.all<{ value: string }>(
    "SELECT value FROM sync_state WHERE key = 'migration_completed'"
  )
  return rows.length === 0 || rows[0].value !== 'true'
}

/**
 * Mark migration as completed
 */
async function markMigrationComplete(): Promise<void> {
  const db = await getDatabase()
  await db.run(
    "INSERT OR REPLACE INTO sync_state (key, value, updated_at) VALUES ('migration_completed', 'true', CURRENT_TIMESTAMP)"
  )
}

/**
 * Generate synthetic events for all existing data
 */
export async function migrateExistingData(
  eventLog: EventLog,
  deviceId: string
): Promise<number> {
  const db = await getDatabase()
  let eventCount = 0

  console.log('[Migration] Starting migration of existing data...')

  // Migrate students
  const students = await db.all<{
    id: string
    name: string
    date_of_birth: string
    grade_level: string
    color: string
  }>('SELECT id, name, date_of_birth, grade_level, color FROM students')

  for (const student of students) {
    const event: Omit<StudentCreatedEvent, 'timestamp' | 'deviceId' | 'version'> = {
      id: createEventId(),
      type: 'student.created',
      data: {
        id: student.id,
        name: student.name,
        dateOfBirth: student.date_of_birth,
        gradeLevel: student.grade_level,
        color: student.color
      }
    }
    await eventLog.append(event as Omit<SyncEvent, 'timestamp' | 'deviceId' | 'version'>)
    eventCount++
  }
  console.log(`[Migration] Migrated ${students.length} students`)

  // Migrate activities
  const activities = await db.all<{
    id: string
    session_id: string | null
    student_id: string
    subject_id: string
    activity_type: string
    title: string
    description: string | null
    date_completed: string
    duration_minutes: number | null
    grade: number | null
    max_grade: number | null
    notes: string | null
    book_title: string | null
    pages_read: number | null
    total_pages: number | null
  }>('SELECT * FROM activities')

  for (const activity of activities) {
    const event: Omit<ActivityLoggedEvent, 'timestamp' | 'deviceId' | 'version'> = {
      id: createEventId(),
      type: 'activity.logged',
      data: {
        id: activity.id,
        sessionId: activity.session_id || undefined,
        studentId: activity.student_id,
        subjectId: activity.subject_id,
        activityType: activity.activity_type,
        title: activity.title,
        description: activity.description || undefined,
        dateCompleted: activity.date_completed,
        durationMinutes: activity.duration_minutes || undefined,
        grade: activity.grade || undefined,
        maxGrade: activity.max_grade || undefined,
        notes: activity.notes || undefined,
        bookTitle: activity.book_title || undefined,
        pagesRead: activity.pages_read || undefined,
        totalPages: activity.total_pages || undefined
      }
    }
    await eventLog.append(event as Omit<SyncEvent, 'timestamp' | 'deviceId' | 'version'>)
    eventCount++
  }
  console.log(`[Migration] Migrated ${activities.length} activities`)

  // Migrate milestones
  const milestones = await db.all<{
    id: string
    student_id: string
    subject_id: string
    template_id: string | null
    title: string
    description: string | null
    category: string | null
    target_date: string | null
    status: string
  }>('SELECT id, student_id, subject_id, template_id, title, description, category, target_date, status FROM milestones')

  for (const milestone of milestones) {
    const event: Omit<MilestoneCreatedEvent, 'timestamp' | 'deviceId' | 'version'> = {
      id: createEventId(),
      type: 'milestone.created',
      data: {
        id: milestone.id,
        studentId: milestone.student_id,
        subjectId: milestone.subject_id,
        templateId: milestone.template_id || undefined,
        title: milestone.title,
        description: milestone.description || undefined,
        category: milestone.category || undefined,
        targetDate: milestone.target_date || undefined,
        status: milestone.status
      }
    }
    await eventLog.append(event as Omit<SyncEvent, 'timestamp' | 'deviceId' | 'version'>)
    eventCount++
  }
  console.log(`[Migration] Migrated ${milestones.length} milestones`)

  // Migrate field trips
  const fieldTrips = await db.all<{
    id: string
    title: string
    location: string
    description: string | null
    date: string
    status: string
    student_ids: string
    subject_ids: string
    cost: number | null
    website_url: string | null
    notes: string | null
    learning_outcomes: string | null
    activity_type: string
    start_time: string | null
    end_time: string | null
  }>('SELECT * FROM field_trips')

  for (const trip of fieldTrips) {
    const event: Omit<FieldTripCreatedEvent, 'timestamp' | 'deviceId' | 'version'> = {
      id: createEventId(),
      type: 'fieldTrip.created',
      data: {
        id: trip.id,
        title: trip.title,
        location: trip.location,
        description: trip.description || undefined,
        date: trip.date,
        status: trip.status,
        studentIds: JSON.parse(trip.student_ids || '[]'),
        subjectIds: JSON.parse(trip.subject_ids || '[]'),
        cost: trip.cost || undefined,
        websiteUrl: trip.website_url || undefined,
        notes: trip.notes || undefined,
        learningOutcomes: trip.learning_outcomes || undefined,
        activityType: trip.activity_type,
        startTime: trip.start_time || undefined,
        endTime: trip.end_time || undefined
      }
    }
    await eventLog.append(event as Omit<SyncEvent, 'timestamp' | 'deviceId' | 'version'>)
    eventCount++
  }
  console.log(`[Migration] Migrated ${fieldTrips.length} field trips`)

  // Migrate books
  const books = await db.all<{
    id: string
    title: string
    author: string | null
    isbn: string | null
    total_pages: number | null
    reading_level: string | null
    genre: string | null
    cover_image_path: string | null
    notes: string | null
  }>('SELECT * FROM books')

  for (const book of books) {
    const event: Omit<BookCreatedEvent, 'timestamp' | 'deviceId' | 'version'> = {
      id: createEventId(),
      type: 'book.created',
      data: {
        id: book.id,
        title: book.title,
        author: book.author || undefined,
        isbn: book.isbn || undefined,
        totalPages: book.total_pages || undefined,
        readingLevel: book.reading_level || undefined,
        genre: book.genre || undefined,
        coverImagePath: book.cover_image_path || undefined,
        notes: book.notes || undefined
      }
    }
    await eventLog.append(event as Omit<SyncEvent, 'timestamp' | 'deviceId' | 'version'>)
    eventCount++
  }
  console.log(`[Migration] Migrated ${books.length} books`)

  // Migrate weekly plans
  const weeklyPlans = await db.all<{
    id: string
    student_id: string
    week_start: string
    milestone_ids: string
  }>('SELECT id, student_id, week_start, milestone_ids FROM weekly_plans')

  for (const plan of weeklyPlans) {
    const event: Omit<WeeklyPlanCreatedEvent, 'timestamp' | 'deviceId' | 'version'> = {
      id: createEventId(),
      type: 'weeklyPlan.created',
      data: {
        id: plan.id,
        studentId: plan.student_id,
        weekStart: plan.week_start,
        milestoneIds: JSON.parse(plan.milestone_ids || '[]')
      }
    }
    await eventLog.append(event as Omit<SyncEvent, 'timestamp' | 'deviceId' | 'version'>)
    eventCount++
  }
  console.log(`[Migration] Migrated ${weeklyPlans.length} weekly plans`)

  await markMigrationComplete()
  console.log(`[Migration] Complete! Generated ${eventCount} events`)

  // Update projector state to reflect that these events are already "applied"
  // (the data already exists in the database)
  if (eventCount > 0) {
    const lastEvent = await eventLog.get((await eventLog.length()) - 1)
    if (lastEvent) {
      const lastIndex = (await eventLog.length()) - 1
      const db = await getDatabase()
      const now = new Date().toISOString()
      await db.run(
        `INSERT OR REPLACE INTO sync_state (key, value, updated_at) VALUES (?, ?, ?)`,
        'last_processed_event_id',
        lastEvent.id,
        now
      )
      await db.run(
        `INSERT OR REPLACE INTO sync_state (key, value, updated_at) VALUES (?, ?, ?)`,
        'last_processed_index',
        lastIndex.toString(),
        now
      )
      await db.run(
        `INSERT OR REPLACE INTO sync_state (key, value, updated_at) VALUES (?, ?, ?)`,
        'processed_count',
        eventCount.toString(),
        now
      )
      console.log(`[Migration] Updated projector state: lastIndex=${lastIndex}, eventCount=${eventCount}`)
    }
  }

  return eventCount
}
