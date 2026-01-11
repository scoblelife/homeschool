/**
 * Event Projector - Applies events to SQLite database
 *
 * The projector transforms the event stream into the current database state.
 * It handles:
 * - Applying individual events to SQLite
 * - Rebuilding the entire database from events
 * - Tracking which events have been processed
 */

import { getDatabase, type Database } from '../database/connection'
import type {
  SyncEvent,
  StudentCreatedEvent,
  StudentUpdatedEvent,
  StudentDeletedEvent,
  ActivityLoggedEvent,
  ActivityUpdatedEvent,
  ActivityDeletedEvent,
  MilestoneCreatedEvent,
  MilestoneUpdatedEvent,
  MilestoneCompletedEvent,
  MilestoneDeletedEvent,
  BookCreatedEvent,
  BookUpdatedEvent,
  BookDeletedEvent,
  StudentBookStartedEvent,
  StudentBookProgressEvent,
  StudentBookFinishedEvent,
  FieldTripCreatedEvent,
  FieldTripUpdatedEvent,
  FieldTripDeletedEvent,
  WeeklyPlanCreatedEvent,
  WeeklyPlanUpdatedEvent,
  SessionCreatedEvent,
  SessionUpdatedEvent,
  SessionDeletedEvent,
  SubjectCreatedEvent,
  SubjectUpdatedEvent,
  SubjectDeletedEvent,
  SettingChangedEvent,
  MemberKickedEvent,
  AttendanceCreatedEvent,
  AttendanceUpdatedEvent,
  AttendanceDeletedEvent
} from './events'
import { HLC } from './hlc'

export interface ProjectorState {
  lastProcessedEventId: string | null
  lastProcessedIndex: number
  processedCount: number
}

export interface KickedMember {
  deviceId: string
  deviceName: string
  kickedAt: string
  reason?: string
}

export class EventProjector {
  private db: Database | null = null
  private state: ProjectorState = {
    lastProcessedEventId: null,
    lastProcessedIndex: -1,
    processedCount: 0
  }
  private blocklist: Set<string> = new Set()

  async initialize(): Promise<void> {
    this.db = await getDatabase()

    // Create sync_state table if not exists
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS sync_state (
        key VARCHAR PRIMARY KEY,
        value VARCHAR NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create kicked_members table for blocklist
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS kicked_members (
        device_id VARCHAR PRIMARY KEY,
        device_name VARCHAR NOT NULL,
        kicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reason VARCHAR
      )
    `)

    // Load current state
    await this.loadState()

    // Load blocklist
    await this.loadBlocklist()
  }

  private async loadBlocklist(): Promise<void> {
    const rows = await this.db!.all<{ device_id: string }>(
      'SELECT device_id FROM kicked_members'
    )
    this.blocklist = new Set(rows.map((r) => r.device_id))
  }

  private async loadState(): Promise<void> {
    const rows = await this.db!.all<{ key: string; value: string }>(
      'SELECT key, value FROM sync_state WHERE key IN (?, ?, ?)',
      'last_processed_event_id',
      'last_processed_index',
      'processed_count'
    )

    for (const row of rows) {
      if (row.key === 'last_processed_event_id') {
        this.state.lastProcessedEventId = row.value
      } else if (row.key === 'last_processed_index') {
        this.state.lastProcessedIndex = parseInt(row.value, 10)
      } else if (row.key === 'processed_count') {
        this.state.processedCount = parseInt(row.value, 10)
      }
    }
  }

  private async saveState(): Promise<void> {
    const now = new Date().toISOString()

    // Upsert each state value
    await this.db!.run(
      `INSERT OR REPLACE INTO sync_state (key, value, updated_at) VALUES (?, ?, ?)`,
      'last_processed_event_id',
      this.state.lastProcessedEventId || '',
      now
    )
    await this.db!.run(
      `INSERT OR REPLACE INTO sync_state (key, value, updated_at) VALUES (?, ?, ?)`,
      'last_processed_index',
      this.state.lastProcessedIndex.toString(),
      now
    )
    await this.db!.run(
      `INSERT OR REPLACE INTO sync_state (key, value, updated_at) VALUES (?, ?, ?)`,
      'processed_count',
      this.state.processedCount.toString(),
      now
    )
  }

  /**
   * Get current projector state
   */
  getState(): ProjectorState {
    return { ...this.state }
  }

  /**
   * Check if a device is blocked
   */
  isBlocked(deviceId: string): boolean {
    return this.blocklist.has(deviceId)
  }

  /**
   * Get all kicked members
   */
  async getKickedMembers(): Promise<KickedMember[]> {
    const rows = await this.db!.all<{
      device_id: string
      device_name: string
      kicked_at: string
      reason: string | null
    }>('SELECT device_id, device_name, kicked_at, reason FROM kicked_members ORDER BY kicked_at DESC')

    return rows.map((r) => ({
      deviceId: r.device_id,
      deviceName: r.device_name,
      kickedAt: r.kicked_at,
      reason: r.reason ?? undefined
    }))
  }

  /**
   * Reload state from database (useful after migration)
   */
  async reloadState(): Promise<void> {
    await this.loadState()
  }

  /**
   * Update state without applying event (for locally-created events
   * where the repository already made the DB change)
   */
  async updateStateOnly(eventId: string, index: number): Promise<void> {
    this.state.lastProcessedEventId = eventId
    this.state.lastProcessedIndex = index
    this.state.processedCount++
    await this.saveState()
  }

  /**
   * Apply a single event to the database
   */
  async apply(event: SyncEvent, index: number): Promise<void> {
    // Skip if already processed
    if (index <= this.state.lastProcessedIndex) {
      return
    }

    await this.applyEvent(event)

    // Update state
    this.state.lastProcessedEventId = event.id
    this.state.lastProcessedIndex = index
    this.state.processedCount++

    await this.saveState()
  }

  /**
   * Apply an event without index tracking (for testing/rebuilding)
   */
  private async applyEvent(event: SyncEvent): Promise<void> {
    switch (event.type) {
      // Student events
      case 'student.created':
        await this.applyStudentCreated(event)
        break
      case 'student.updated':
        await this.applyStudentUpdated(event)
        break
      case 'student.deleted':
        await this.applyStudentDeleted(event)
        break

      // Subject events
      case 'subject.created':
        await this.applySubjectCreated(event)
        break
      case 'subject.updated':
        await this.applySubjectUpdated(event)
        break
      case 'subject.deleted':
        await this.applySubjectDeleted(event)
        break

      // Activity events
      case 'activity.logged':
        await this.applyActivityLogged(event)
        break
      case 'activity.updated':
        await this.applyActivityUpdated(event)
        break
      case 'activity.deleted':
        await this.applyActivityDeleted(event)
        break

      // Milestone events
      case 'milestone.created':
        await this.applyMilestoneCreated(event)
        break
      case 'milestone.updated':
        await this.applyMilestoneUpdated(event)
        break
      case 'milestone.completed':
        await this.applyMilestoneCompleted(event)
        break
      case 'milestone.deleted':
        await this.applyMilestoneDeleted(event)
        break

      // Book events
      case 'book.created':
        await this.applyBookCreated(event)
        break
      case 'book.updated':
        await this.applyBookUpdated(event)
        break
      case 'book.deleted':
        await this.applyBookDeleted(event)
        break

      // Student book events
      case 'studentBook.started':
        await this.applyStudentBookStarted(event)
        break
      case 'studentBook.progress':
        await this.applyStudentBookProgress(event)
        break
      case 'studentBook.finished':
        await this.applyStudentBookFinished(event)
        break

      // Field trip events
      case 'fieldTrip.created':
        await this.applyFieldTripCreated(event)
        break
      case 'fieldTrip.updated':
        await this.applyFieldTripUpdated(event)
        break
      case 'fieldTrip.deleted':
        await this.applyFieldTripDeleted(event)
        break

      // Weekly plan events
      case 'weeklyPlan.created':
        await this.applyWeeklyPlanCreated(event)
        break
      case 'weeklyPlan.updated':
        await this.applyWeeklyPlanUpdated(event)
        break

      // Session events
      case 'session.created':
        await this.applySessionCreated(event)
        break
      case 'session.updated':
        await this.applySessionUpdated(event)
        break
      case 'session.deleted':
        await this.applySessionDeleted(event)
        break

      // Attendance events
      case 'attendance.created':
        await this.applyAttendanceCreated(event)
        break
      case 'attendance.updated':
        await this.applyAttendanceUpdated(event)
        break
      case 'attendance.deleted':
        await this.applyAttendanceDeleted(event)
        break

      // Settings events
      case 'setting.changed':
        await this.applySettingChanged(event)
        break

      // Member management events
      case 'member.kicked':
        await this.applyMemberKicked(event)
        break

      default:
        console.warn('Unknown event type:', (event as SyncEvent).type)
    }
  }

  // ============ Student Event Handlers ============

  private async applyStudentCreated(event: StudentCreatedEvent): Promise<void> {
    const { id, name, dateOfBirth, gradeLevel, color } = event.data
    await this.db!.run(
      `INSERT OR REPLACE INTO students (id, name, date_of_birth, grade_level, color, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      id,
      name,
      dateOfBirth,
      gradeLevel,
      color
    )
  }

  private async applyStudentUpdated(event: StudentUpdatedEvent): Promise<void> {
    const { id, changes } = event.data
    const updates: string[] = []
    const values: unknown[] = []

    if (changes.name !== undefined) {
      updates.push('name = ?')
      values.push(changes.name)
    }
    if (changes.dateOfBirth !== undefined) {
      updates.push('date_of_birth = ?')
      values.push(changes.dateOfBirth)
    }
    if (changes.gradeLevel !== undefined) {
      updates.push('grade_level = ?')
      values.push(changes.gradeLevel)
    }
    if (changes.color !== undefined) {
      updates.push('color = ?')
      values.push(changes.color)
    }
    if (changes.calendarFeedUrl !== undefined) {
      updates.push('calendar_feed_url = ?')
      values.push(changes.calendarFeedUrl)
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP')
      values.push(id)
      await this.db!.run(
        `UPDATE students SET ${updates.join(', ')} WHERE id = ?`,
        ...values
      )
    }
  }

  private async applyStudentDeleted(event: StudentDeletedEvent): Promise<void> {
    await this.db!.run('DELETE FROM students WHERE id = ?', event.data.id)
  }

  // ============ Subject Event Handlers ============

  private async applySubjectCreated(event: SubjectCreatedEvent): Promise<void> {
    const { id, name, description, gradeLevels } = event.data
    await this.db!.run(
      `INSERT OR REPLACE INTO subjects (id, name, description, grade_levels, created_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      id,
      name,
      description || null,
      JSON.stringify(gradeLevels)
    )
  }

  private async applySubjectUpdated(event: SubjectUpdatedEvent): Promise<void> {
    const { id, changes } = event.data
    const updates: string[] = []
    const values: unknown[] = []

    if (changes.name !== undefined) {
      updates.push('name = ?')
      values.push(changes.name)
    }
    if (changes.description !== undefined) {
      updates.push('description = ?')
      values.push(changes.description)
    }
    if (changes.gradeLevels !== undefined) {
      updates.push('grade_levels = ?')
      values.push(JSON.stringify(changes.gradeLevels))
    }

    if (updates.length > 0) {
      values.push(id)
      await this.db!.run(
        `UPDATE subjects SET ${updates.join(', ')} WHERE id = ?`,
        ...values
      )
    }
  }

  private async applySubjectDeleted(event: SubjectDeletedEvent): Promise<void> {
    await this.db!.run('DELETE FROM subjects WHERE id = ?', event.data.id)
  }

  // ============ Activity Event Handlers ============

  private async applyActivityLogged(event: ActivityLoggedEvent): Promise<void> {
    const d = event.data
    await this.db!.run(
      `INSERT OR REPLACE INTO activities
       (id, session_id, student_id, subject_id, activity_type, title, description,
        date_completed, duration_minutes, grade, max_grade, notes, book_title,
        pages_read, total_pages, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      d.id,
      d.sessionId || null,
      d.studentId,
      d.subjectId,
      d.activityType,
      d.title,
      d.description || null,
      d.dateCompleted,
      d.durationMinutes || null,
      d.grade || null,
      d.maxGrade || null,
      d.notes || null,
      d.bookTitle || null,
      d.pagesRead || null,
      d.totalPages || null
    )
  }

  private async applyActivityUpdated(event: ActivityUpdatedEvent): Promise<void> {
    const { id, changes } = event.data
    const updates: string[] = []
    const values: unknown[] = []

    const fieldMap: Record<string, string> = {
      title: 'title',
      description: 'description',
      dateCompleted: 'date_completed',
      durationMinutes: 'duration_minutes',
      grade: 'grade',
      maxGrade: 'max_grade',
      notes: 'notes',
      bookTitle: 'book_title',
      pagesRead: 'pages_read',
      totalPages: 'total_pages'
    }

    for (const [key, column] of Object.entries(fieldMap)) {
      if ((changes as Record<string, unknown>)[key] !== undefined) {
        updates.push(`${column} = ?`)
        values.push((changes as Record<string, unknown>)[key])
      }
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP')
      values.push(id)
      await this.db!.run(
        `UPDATE activities SET ${updates.join(', ')} WHERE id = ?`,
        ...values
      )
    }
  }

  private async applyActivityDeleted(event: ActivityDeletedEvent): Promise<void> {
    await this.db!.run('DELETE FROM activities WHERE id = ?', event.data.id)
  }

  // ============ Milestone Event Handlers ============

  private async applyMilestoneCreated(event: MilestoneCreatedEvent): Promise<void> {
    const d = event.data
    await this.db!.run(
      `INSERT OR REPLACE INTO milestones
       (id, student_id, subject_id, template_id, title, description, category,
        target_date, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      d.id,
      d.studentId,
      d.subjectId,
      d.templateId || null,
      d.title,
      d.description || null,
      d.category || null,
      d.targetDate || null,
      d.status
    )
  }

  private async applyMilestoneUpdated(event: MilestoneUpdatedEvent): Promise<void> {
    const { id, changes } = event.data
    const updates: string[] = []
    const values: unknown[] = []

    const fieldMap: Record<string, string> = {
      title: 'title',
      description: 'description',
      category: 'category',
      targetDate: 'target_date',
      status: 'status',
      evidenceNotes: 'evidence_notes',
      completedDate: 'completed_date'
    }

    for (const [key, column] of Object.entries(fieldMap)) {
      if ((changes as Record<string, unknown>)[key] !== undefined) {
        updates.push(`${column} = ?`)
        values.push((changes as Record<string, unknown>)[key])
      }
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP')
      values.push(id)
      await this.db!.run(
        `UPDATE milestones SET ${updates.join(', ')} WHERE id = ?`,
        ...values
      )
    }
  }

  private async applyMilestoneCompleted(event: MilestoneCompletedEvent): Promise<void> {
    const { id, completedDate, evidenceNotes } = event.data
    await this.db!.run(
      `UPDATE milestones
       SET status = 'completed', completed_date = ?, evidence_notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      completedDate,
      evidenceNotes || null,
      id
    )
  }

  private async applyMilestoneDeleted(event: MilestoneDeletedEvent): Promise<void> {
    await this.db!.run('DELETE FROM milestones WHERE id = ?', event.data.id)
  }

  // ============ Book Event Handlers ============

  private async applyBookCreated(event: BookCreatedEvent): Promise<void> {
    const d = event.data
    await this.db!.run(
      `INSERT OR REPLACE INTO books
       (id, title, author, isbn, total_pages, reading_level, genre, cover_image_path, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      d.id,
      d.title,
      d.author || null,
      d.isbn || null,
      d.totalPages || null,
      d.readingLevel || null,
      d.genre || null,
      d.coverImagePath || null,
      d.notes || null
    )
  }

  private async applyBookUpdated(event: BookUpdatedEvent): Promise<void> {
    const { id, changes } = event.data
    const updates: string[] = []
    const values: unknown[] = []

    const fieldMap: Record<string, string> = {
      title: 'title',
      author: 'author',
      isbn: 'isbn',
      totalPages: 'total_pages',
      readingLevel: 'reading_level',
      genre: 'genre',
      coverImagePath: 'cover_image_path',
      notes: 'notes'
    }

    for (const [key, column] of Object.entries(fieldMap)) {
      if ((changes as Record<string, unknown>)[key] !== undefined) {
        updates.push(`${column} = ?`)
        values.push((changes as Record<string, unknown>)[key])
      }
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP')
      values.push(id)
      await this.db!.run(
        `UPDATE books SET ${updates.join(', ')} WHERE id = ?`,
        ...values
      )
    }
  }

  private async applyBookDeleted(event: BookDeletedEvent): Promise<void> {
    await this.db!.run('DELETE FROM books WHERE id = ?', event.data.id)
  }

  // ============ Student Book Event Handlers ============

  private async applyStudentBookStarted(event: StudentBookStartedEvent): Promise<void> {
    const { id, studentId, bookId, startedDate } = event.data
    await this.db!.run(
      `INSERT OR REPLACE INTO student_books
       (id, student_id, book_id, status, started_date, created_at, updated_at)
       VALUES (?, ?, ?, 'reading', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      id,
      studentId,
      bookId,
      startedDate
    )
  }

  private async applyStudentBookProgress(event: StudentBookProgressEvent): Promise<void> {
    const { studentId, bookId, currentPage } = event.data
    await this.db!.run(
      `UPDATE student_books SET current_page = ?, updated_at = CURRENT_TIMESTAMP
       WHERE student_id = ? AND book_id = ?`,
      currentPage,
      studentId,
      bookId
    )
  }

  private async applyStudentBookFinished(event: StudentBookFinishedEvent): Promise<void> {
    const { studentId, bookId, finishedDate, rating, notes } = event.data
    await this.db!.run(
      `UPDATE student_books
       SET status = 'finished', finished_date = ?, rating = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE student_id = ? AND book_id = ?`,
      finishedDate,
      rating || null,
      notes || null,
      studentId,
      bookId
    )
  }

  // ============ Field Trip Event Handlers ============

  private async applyFieldTripCreated(event: FieldTripCreatedEvent): Promise<void> {
    const d = event.data
    await this.db!.run(
      `INSERT OR REPLACE INTO field_trips
       (id, title, location, description, date, status, student_ids, subject_ids,
        cost, website_url, notes, learning_outcomes, activity_type, start_time, end_time, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      d.id,
      d.title,
      d.location,
      d.description || null,
      d.date,
      d.status,
      JSON.stringify(d.studentIds),
      JSON.stringify(d.subjectIds),
      d.cost || null,
      d.websiteUrl || null,
      d.notes || null,
      d.learningOutcomes || null,
      d.activityType,
      d.startTime || null,
      d.endTime || null
    )
  }

  private async applyFieldTripUpdated(event: FieldTripUpdatedEvent): Promise<void> {
    const { id, changes } = event.data
    const updates: string[] = []
    const values: unknown[] = []

    const fieldMap: Record<string, string> = {
      title: 'title',
      location: 'location',
      description: 'description',
      date: 'date',
      status: 'status',
      cost: 'cost',
      websiteUrl: 'website_url',
      notes: 'notes',
      learningOutcomes: 'learning_outcomes',
      activityType: 'activity_type',
      startTime: 'start_time',
      endTime: 'end_time'
    }

    for (const [key, column] of Object.entries(fieldMap)) {
      if ((changes as Record<string, unknown>)[key] !== undefined) {
        updates.push(`${column} = ?`)
        values.push((changes as Record<string, unknown>)[key])
      }
    }

    // Handle array fields
    if (changes.studentIds !== undefined) {
      updates.push('student_ids = ?')
      values.push(JSON.stringify(changes.studentIds))
    }
    if (changes.subjectIds !== undefined) {
      updates.push('subject_ids = ?')
      values.push(JSON.stringify(changes.subjectIds))
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP')
      values.push(id)
      await this.db!.run(
        `UPDATE field_trips SET ${updates.join(', ')} WHERE id = ?`,
        ...values
      )
    }
  }

  private async applyFieldTripDeleted(event: FieldTripDeletedEvent): Promise<void> {
    await this.db!.run('DELETE FROM field_trips WHERE id = ?', event.data.id)
  }

  // ============ Weekly Plan Event Handlers ============

  private async applyWeeklyPlanCreated(event: WeeklyPlanCreatedEvent): Promise<void> {
    const { id, studentId, weekStart, milestoneIds } = event.data
    await this.db!.run(
      `INSERT OR REPLACE INTO weekly_plans
       (id, student_id, week_start, milestone_ids, created_at, updated_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      id,
      studentId,
      weekStart,
      JSON.stringify(milestoneIds)
    )
  }

  private async applyWeeklyPlanUpdated(event: WeeklyPlanUpdatedEvent): Promise<void> {
    const { id, changes } = event.data
    if (changes.milestoneIds !== undefined) {
      await this.db!.run(
        `UPDATE weekly_plans SET milestone_ids = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        JSON.stringify(changes.milestoneIds),
        id
      )
    }
  }

  // ============ Session Event Handlers ============

  private async applySessionCreated(event: SessionCreatedEvent): Promise<void> {
    const { id, studentId, subjectId, date, startTime, endTime, notes } = event.data
    await this.db!.run(
      `INSERT OR REPLACE INTO sessions
       (id, student_id, subject_id, date, start_time, end_time, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      id,
      studentId,
      subjectId,
      date,
      startTime || null,
      endTime || null,
      notes || null
    )
  }

  private async applySessionUpdated(event: SessionUpdatedEvent): Promise<void> {
    const { id, changes } = event.data
    const updates: string[] = []
    const values: unknown[] = []

    const fieldMap: Record<string, string> = {
      date: 'date',
      startTime: 'start_time',
      endTime: 'end_time',
      notes: 'notes'
    }

    for (const [key, column] of Object.entries(fieldMap)) {
      if ((changes as Record<string, unknown>)[key] !== undefined) {
        updates.push(`${column} = ?`)
        values.push((changes as Record<string, unknown>)[key])
      }
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP')
      values.push(id)
      await this.db!.run(
        `UPDATE sessions SET ${updates.join(', ')} WHERE id = ?`,
        ...values
      )
    }
  }

  private async applySessionDeleted(event: SessionDeletedEvent): Promise<void> {
    await this.db!.run('DELETE FROM sessions WHERE id = ?', event.data.id)
  }

  // ============ Attendance Event Handlers ============

  private async applyAttendanceCreated(event: AttendanceCreatedEvent): Promise<void> {
    const { id, studentId, date, status, notes } = event.data
    await this.db!.run(
      `INSERT OR REPLACE INTO attendance
       (id, student_id, date, status, notes, created_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      id,
      studentId,
      date,
      status,
      notes || null
    )
  }

  private async applyAttendanceUpdated(event: AttendanceUpdatedEvent): Promise<void> {
    const { studentId, date, status, notes } = event.data
    await this.db!.run(
      `UPDATE attendance SET status = ?, notes = ? WHERE student_id = ? AND date = ?`,
      status,
      notes || null,
      studentId,
      date
    )
  }

  private async applyAttendanceDeleted(event: AttendanceDeletedEvent): Promise<void> {
    const { studentId, date } = event.data
    await this.db!.run(
      'DELETE FROM attendance WHERE student_id = ? AND date = ?',
      studentId,
      date
    )
  }

  // ============ Settings Event Handlers ============

  private async applySettingChanged(event: SettingChangedEvent): Promise<void> {
    const { key, value } = event.data
    await this.db!.run(
      `INSERT OR REPLACE INTO user_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)`,
      key,
      value
    )
  }

  // ============ Member Management Event Handlers ============

  private async applyMemberKicked(event: MemberKickedEvent): Promise<void> {
    const { kickedDeviceId, kickedDeviceName, reason } = event.data

    // Add to kicked_members table
    await this.db!.run(
      `INSERT OR REPLACE INTO kicked_members (device_id, device_name, kicked_at, reason)
       VALUES (?, ?, ?, ?)`,
      kickedDeviceId,
      kickedDeviceName,
      new Date().toISOString(),
      reason || null
    )

    // Update in-memory blocklist
    this.blocklist.add(kickedDeviceId)

    console.log('[Projector] Member kicked:', kickedDeviceName, '(' + kickedDeviceId.slice(0, 8) + '...)')
  }

  // ============ Rebuild Support ============

  /**
   * Clear all data and rebuild from an event stream
   */
  async rebuild(events: AsyncIterable<SyncEvent> | SyncEvent[]): Promise<void> {
    // Clear all tables (except templates and sync_state)
    const tablesToClear = [
      'students',
      'activities',
      'milestones',
      'books',
      'student_books',
      'field_trips',
      'weekly_plans',
      'sessions',
      'subjects',
      'attendance'
    ]

    for (const table of tablesToClear) {
      await this.db!.run(`DELETE FROM ${table}`)
    }

    // Reset state
    this.state = {
      lastProcessedEventId: null,
      lastProcessedIndex: -1,
      processedCount: 0
    }

    // Apply all events in order
    let index = 0
    for await (const event of events) {
      await this.apply(event, index)
      index++
    }
  }
}

/**
 * Create and initialize an event projector
 */
export async function createProjector(): Promise<EventProjector> {
  const projector = new EventProjector()
  await projector.initialize()
  return projector
}
