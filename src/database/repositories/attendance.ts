import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../connection'
import type { AttendanceRecord, AttendanceStatus, CreateAttendanceRecord } from '../../shared/types'
import { emitSyncEvent } from '../syncEmitter'

function rowToAttendanceRecord(row: Record<string, unknown>): AttendanceRecord {
  return {
    id: row.id as string,
    studentId: row.student_id as string,
    date: row.date as string,
    status: row.status as AttendanceStatus,
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string,
  }
}

export async function getAttendanceRecords(
  studentId: string,
  startDate: string,
  endDate: string
): Promise<AttendanceRecord[]> {
  const db = await getDatabase()
  const rows = await db.all(
    `SELECT * FROM attendance
     WHERE student_id = ? AND date >= ? AND date <= ?
     ORDER BY date`,
    studentId,
    startDate,
    endDate
  )
  return rows.map(rowToAttendanceRecord)
}

export async function getAttendanceRecord(
  studentId: string,
  date: string
): Promise<AttendanceRecord | null> {
  const db = await getDatabase()
  const rows = await db.all(
    `SELECT * FROM attendance WHERE student_id = ? AND date = ?`,
    studentId,
    date
  )
  return rows.length > 0 ? rowToAttendanceRecord(rows[0]) : null
}

export async function setAttendanceRecord(
  data: CreateAttendanceRecord
): Promise<AttendanceRecord> {
  const db = await getDatabase()

  // Check if record already exists
  const existing = await getAttendanceRecord(data.studentId, data.date)

  if (existing) {
    // Update existing record
    await db.run(
      `UPDATE attendance SET status = ?, notes = ? WHERE student_id = ? AND date = ?`,
      data.status,
      data.notes || null,
      data.studentId,
      data.date
    )

    await emitSyncEvent({
      type: 'attendance.updated',
      data: {
        id: existing.id,
        studentId: data.studentId,
        date: data.date,
        status: data.status,
        notes: data.notes,
      },
    })

    return (await getAttendanceRecord(data.studentId, data.date))!
  } else {
    // Create new record
    const id = uuidv4()
    const now = new Date().toISOString()

    await db.run(
      `INSERT INTO attendance (id, student_id, date, status, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      id,
      data.studentId,
      data.date,
      data.status,
      data.notes || null,
      now
    )

    await emitSyncEvent({
      type: 'attendance.created',
      data: {
        id,
        studentId: data.studentId,
        date: data.date,
        status: data.status,
        notes: data.notes,
      },
    })

    return (await getAttendanceRecord(data.studentId, data.date))!
  }
}

export async function deleteAttendanceRecord(
  studentId: string,
  date: string
): Promise<void> {
  const db = await getDatabase()
  const existing = await getAttendanceRecord(studentId, date)

  if (existing) {
    await db.run(
      `DELETE FROM attendance WHERE student_id = ? AND date = ?`,
      studentId,
      date
    )

    await emitSyncEvent({
      type: 'attendance.deleted',
      data: {
        id: existing.id,
        studentId,
        date,
      },
    })
  }
}

export async function getAttendanceStats(
  studentId: string,
  startDate: string,
  endDate: string
): Promise<{
  totalDays: number
  schoolDays: number
  absences: number
  percentage: number
}> {
  const db = await getDatabase()

  // Count school days
  const schoolDaysResult = await db.all(
    `SELECT COUNT(*) as count FROM attendance
     WHERE student_id = ? AND date >= ? AND date <= ? AND status = 'school'`,
    studentId,
    startDate,
    endDate
  )
  const schoolDays = (schoolDaysResult[0] as { count: number }).count

  // Count non-school days (absences)
  const absencesResult = await db.all(
    `SELECT COUNT(*) as count FROM attendance
     WHERE student_id = ? AND date >= ? AND date <= ? AND status != 'school'`,
    studentId,
    startDate,
    endDate
  )
  const absences = (absencesResult[0] as { count: number }).count

  const totalDays = schoolDays + absences
  const percentage = totalDays > 0 ? Math.round((schoolDays / totalDays) * 100) : 0

  return {
    totalDays,
    schoolDays,
    absences,
    percentage,
  }
}
