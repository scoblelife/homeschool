/**
 * Umbrella School Repository
 *
 * CRUD operations for umbrella/cover schools, enrollments, and reports.
 * Umbrella schools are private schools that homeschool families can enroll in
 * for administrative purposes and compliance support.
 */

import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../connection'
import type {
  UmbrellaSchool,
  CreateUmbrellaSchool,
  UpdateUmbrellaSchool,
  UmbrellaSchoolEnrollment,
  CreateUmbrellaSchoolEnrollment,
  UpdateUmbrellaSchoolEnrollment,
  UmbrellaSchoolReport,
  CreateUmbrellaSchoolReport,
  UpdateUmbrellaSchoolReport,
  UmbrellaReportFrequency,
  UmbrellaEnrollmentStatus,
  UmbrellaReportStatus,
  UmbrellaReportType,
  UmbrellaSchoolRequirement,
} from '../../shared/types'

// ============================================================================
// Umbrella Schools
// ============================================================================

function rowToUmbrellaSchool(row: Record<string, unknown>): UmbrellaSchool {
  let requirements: UmbrellaSchoolRequirement[] = []
  try {
    requirements = row.requirements_json ? JSON.parse(row.requirements_json as string) : []
  } catch {
    requirements = []
  }

  return {
    id: row.id as string,
    name: row.name as string,
    state: row.state as string,
    contactName: row.contact_name as string | undefined,
    contactEmail: row.contact_email as string | undefined,
    contactPhone: row.contact_phone as string | undefined,
    websiteUrl: row.website_url as string | undefined,
    address: row.address as string | undefined,
    enrollmentFee: row.enrollment_fee as number | undefined,
    annualFee: row.annual_fee as number | undefined,
    enrollmentStartDate: row.enrollment_start_date as string | undefined,
    enrollmentEndDate: row.enrollment_end_date as string | undefined,
    reportFrequency: row.report_frequency as UmbrellaReportFrequency | undefined,
    reportDueDay: row.report_due_day as number | undefined,
    requirements,
    notes: row.notes as string | undefined,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export async function getUmbrellaSchools(): Promise<UmbrellaSchool[]> {
  const db = await getDatabase()
  const rows = await db.all('SELECT * FROM umbrella_schools ORDER BY name ASC')
  return rows.map(rowToUmbrellaSchool)
}

export async function getUmbrellaSchoolById(id: string): Promise<UmbrellaSchool | null> {
  const db = await getDatabase()
  const rows = await db.all('SELECT * FROM umbrella_schools WHERE id = ?', id)
  return rows.length > 0 ? rowToUmbrellaSchool(rows[0]) : null
}

export async function getActiveUmbrellaSchools(): Promise<UmbrellaSchool[]> {
  const db = await getDatabase()
  const rows = await db.all('SELECT * FROM umbrella_schools WHERE is_active = TRUE ORDER BY name ASC')
  return rows.map(rowToUmbrellaSchool)
}

export async function createUmbrellaSchool(data: CreateUmbrellaSchool): Promise<UmbrellaSchool> {
  const db = await getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  await db.run(
    `INSERT INTO umbrella_schools (
      id, name, state, contact_name, contact_email, contact_phone,
      website_url, address, enrollment_fee, annual_fee,
      enrollment_start_date, enrollment_end_date, report_frequency,
      report_due_day, requirements_json, notes, is_active,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.name,
    data.state,
    data.contactName,
    data.contactEmail,
    data.contactPhone,
    data.websiteUrl,
    data.address,
    data.enrollmentFee,
    data.annualFee,
    data.enrollmentStartDate,
    data.enrollmentEndDate,
    data.reportFrequency,
    data.reportDueDay,
    JSON.stringify(data.requirements),
    data.notes,
    data.isActive,
    now,
    now
  )

  return (await getUmbrellaSchoolById(id))!
}

export async function updateUmbrellaSchool(
  id: string,
  updates: UpdateUmbrellaSchool
): Promise<UmbrellaSchool | null> {
  const db = await getDatabase()
  const now = new Date().toISOString()

  const fields: string[] = ['updated_at = ?']
  const params: (string | number | boolean | null)[] = [now]

  if (updates.name !== undefined) {
    fields.push('name = ?')
    params.push(updates.name)
  }
  if (updates.contactName !== undefined) {
    fields.push('contact_name = ?')
    params.push(updates.contactName ?? null)
  }
  if (updates.contactEmail !== undefined) {
    fields.push('contact_email = ?')
    params.push(updates.contactEmail ?? null)
  }
  if (updates.contactPhone !== undefined) {
    fields.push('contact_phone = ?')
    params.push(updates.contactPhone ?? null)
  }
  if (updates.websiteUrl !== undefined) {
    fields.push('website_url = ?')
    params.push(updates.websiteUrl ?? null)
  }
  if (updates.address !== undefined) {
    fields.push('address = ?')
    params.push(updates.address ?? null)
  }
  if (updates.enrollmentFee !== undefined) {
    fields.push('enrollment_fee = ?')
    params.push(updates.enrollmentFee ?? null)
  }
  if (updates.annualFee !== undefined) {
    fields.push('annual_fee = ?')
    params.push(updates.annualFee ?? null)
  }
  if (updates.enrollmentStartDate !== undefined) {
    fields.push('enrollment_start_date = ?')
    params.push(updates.enrollmentStartDate ?? null)
  }
  if (updates.enrollmentEndDate !== undefined) {
    fields.push('enrollment_end_date = ?')
    params.push(updates.enrollmentEndDate ?? null)
  }
  if (updates.reportFrequency !== undefined) {
    fields.push('report_frequency = ?')
    params.push(updates.reportFrequency ?? null)
  }
  if (updates.reportDueDay !== undefined) {
    fields.push('report_due_day = ?')
    params.push(updates.reportDueDay ?? null)
  }
  if (updates.requirements !== undefined) {
    fields.push('requirements_json = ?')
    params.push(JSON.stringify(updates.requirements))
  }
  if (updates.notes !== undefined) {
    fields.push('notes = ?')
    params.push(updates.notes ?? null)
  }
  if (updates.isActive !== undefined) {
    fields.push('is_active = ?')
    params.push(updates.isActive)
  }

  params.push(id)

  await db.run(`UPDATE umbrella_schools SET ${fields.join(', ')} WHERE id = ?`, ...params)

  return getUmbrellaSchoolById(id)
}

export async function deleteUmbrellaSchool(id: string): Promise<void> {
  const db = await getDatabase()
  // Delete related enrollments and reports first (cascading delete)
  await db.run('DELETE FROM umbrella_school_reports WHERE umbrella_school_id = ?', id)
  await db.run('DELETE FROM umbrella_school_enrollments WHERE umbrella_school_id = ?', id)
  await db.run('DELETE FROM umbrella_schools WHERE id = ?', id)
}

// ============================================================================
// Umbrella School Enrollments
// ============================================================================

function rowToEnrollment(row: Record<string, unknown>): UmbrellaSchoolEnrollment {
  return {
    id: row.id as string,
    umbrellaSchoolId: row.umbrella_school_id as string,
    studentId: row.student_id as string,
    studentIdAtSchool: row.student_id_at_school as string | undefined,
    gradeLevel: row.grade_level as string | undefined,
    enrolledDate: row.enrolled_date as string,
    withdrawnDate: row.withdrawn_date as string | undefined,
    status: row.status as UmbrellaEnrollmentStatus,
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export async function getEnrollments(
  schoolId?: string,
  studentId?: string
): Promise<UmbrellaSchoolEnrollment[]> {
  const db = await getDatabase()

  let query = 'SELECT * FROM umbrella_school_enrollments WHERE 1=1'
  const params: string[] = []

  if (schoolId) {
    query += ' AND umbrella_school_id = ?'
    params.push(schoolId)
  }
  if (studentId) {
    query += ' AND student_id = ?'
    params.push(studentId)
  }

  query += ' ORDER BY enrolled_date DESC'

  const rows = await db.all(query, ...params)
  return rows.map(rowToEnrollment)
}

export async function getEnrollmentById(id: string): Promise<UmbrellaSchoolEnrollment | null> {
  const db = await getDatabase()
  const rows = await db.all('SELECT * FROM umbrella_school_enrollments WHERE id = ?', id)
  return rows.length > 0 ? rowToEnrollment(rows[0]) : null
}

export async function getActiveEnrollments(studentId?: string): Promise<UmbrellaSchoolEnrollment[]> {
  const db = await getDatabase()

  let query = `SELECT * FROM umbrella_school_enrollments WHERE status = 'active'`
  const params: string[] = []

  if (studentId) {
    query += ' AND student_id = ?'
    params.push(studentId)
  }

  query += ' ORDER BY enrolled_date DESC'

  const rows = await db.all(query, ...params)
  return rows.map(rowToEnrollment)
}

export async function createEnrollment(
  data: CreateUmbrellaSchoolEnrollment
): Promise<UmbrellaSchoolEnrollment> {
  const db = await getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  await db.run(
    `INSERT INTO umbrella_school_enrollments (
      id, umbrella_school_id, student_id, student_id_at_school,
      grade_level, enrolled_date, withdrawn_date, status, notes,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.umbrellaSchoolId,
    data.studentId,
    data.studentIdAtSchool,
    data.gradeLevel,
    data.enrolledDate,
    data.withdrawnDate,
    data.status,
    data.notes,
    now,
    now
  )

  return (await getEnrollmentById(id))!
}

export async function updateEnrollment(
  id: string,
  updates: UpdateUmbrellaSchoolEnrollment
): Promise<UmbrellaSchoolEnrollment | null> {
  const db = await getDatabase()
  const now = new Date().toISOString()

  const fields: string[] = ['updated_at = ?']
  const params: (string | null)[] = [now]

  if (updates.studentIdAtSchool !== undefined) {
    fields.push('student_id_at_school = ?')
    params.push(updates.studentIdAtSchool ?? null)
  }
  if (updates.gradeLevel !== undefined) {
    fields.push('grade_level = ?')
    params.push(updates.gradeLevel ?? null)
  }
  if (updates.enrolledDate !== undefined) {
    fields.push('enrolled_date = ?')
    params.push(updates.enrolledDate)
  }
  if (updates.withdrawnDate !== undefined) {
    fields.push('withdrawn_date = ?')
    params.push(updates.withdrawnDate ?? null)
  }
  if (updates.status !== undefined) {
    fields.push('status = ?')
    params.push(updates.status)
  }
  if (updates.notes !== undefined) {
    fields.push('notes = ?')
    params.push(updates.notes ?? null)
  }

  params.push(id)

  await db.run(`UPDATE umbrella_school_enrollments SET ${fields.join(', ')} WHERE id = ?`, ...params)

  return getEnrollmentById(id)
}

export async function deleteEnrollment(id: string): Promise<void> {
  const db = await getDatabase()
  await db.run('DELETE FROM umbrella_school_enrollments WHERE id = ?', id)
}

// ============================================================================
// Umbrella School Reports
// ============================================================================

function rowToReport(row: Record<string, unknown>): UmbrellaSchoolReport {
  let content: Record<string, unknown> | undefined
  try {
    content = row.content_json ? JSON.parse(row.content_json as string) : undefined
  } catch {
    content = undefined
  }

  return {
    id: row.id as string,
    umbrellaSchoolId: row.umbrella_school_id as string,
    studentId: row.student_id as string,
    reportType: row.report_type as UmbrellaReportType,
    periodStart: row.period_start as string,
    periodEnd: row.period_end as string,
    dueDate: row.due_date as string | undefined,
    submittedDate: row.submitted_date as string | undefined,
    status: row.status as UmbrellaReportStatus,
    content,
    filePath: row.file_path as string | undefined,
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export async function getReports(
  schoolId?: string,
  studentId?: string
): Promise<UmbrellaSchoolReport[]> {
  const db = await getDatabase()

  let query = 'SELECT * FROM umbrella_school_reports WHERE 1=1'
  const params: string[] = []

  if (schoolId) {
    query += ' AND umbrella_school_id = ?'
    params.push(schoolId)
  }
  if (studentId) {
    query += ' AND student_id = ?'
    params.push(studentId)
  }

  query += ' ORDER BY due_date ASC, created_at DESC'

  const rows = await db.all(query, ...params)
  return rows.map(rowToReport)
}

export async function getReportById(id: string): Promise<UmbrellaSchoolReport | null> {
  const db = await getDatabase()
  const rows = await db.all('SELECT * FROM umbrella_school_reports WHERE id = ?', id)
  return rows.length > 0 ? rowToReport(rows[0]) : null
}

export async function getPendingReports(schoolId?: string): Promise<UmbrellaSchoolReport[]> {
  const db = await getDatabase()

  let query = `SELECT * FROM umbrella_school_reports WHERE status = 'pending'`
  const params: string[] = []

  if (schoolId) {
    query += ' AND umbrella_school_id = ?'
    params.push(schoolId)
  }

  query += ' ORDER BY due_date ASC'

  const rows = await db.all(query, ...params)
  return rows.map(rowToReport)
}

export async function getOverdueReports(): Promise<UmbrellaSchoolReport[]> {
  const db = await getDatabase()
  const today = new Date().toISOString().split('T')[0]

  const rows = await db.all(
    `SELECT * FROM umbrella_school_reports
     WHERE status = 'pending' AND due_date < ?
     ORDER BY due_date ASC`,
    today
  )
  return rows.map(rowToReport)
}

export async function createReport(data: CreateUmbrellaSchoolReport): Promise<UmbrellaSchoolReport> {
  const db = await getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  await db.run(
    `INSERT INTO umbrella_school_reports (
      id, umbrella_school_id, student_id, report_type,
      period_start, period_end, due_date, submitted_date,
      status, content_json, file_path, notes,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.umbrellaSchoolId,
    data.studentId,
    data.reportType,
    data.periodStart,
    data.periodEnd,
    data.dueDate,
    data.submittedDate,
    data.status,
    data.content ? JSON.stringify(data.content) : null,
    data.filePath,
    data.notes,
    now,
    now
  )

  return (await getReportById(id))!
}

export async function updateReport(
  id: string,
  updates: UpdateUmbrellaSchoolReport
): Promise<UmbrellaSchoolReport | null> {
  const db = await getDatabase()
  const now = new Date().toISOString()

  const fields: string[] = ['updated_at = ?']
  const params: (string | null)[] = [now]

  if (updates.reportType !== undefined) {
    fields.push('report_type = ?')
    params.push(updates.reportType)
  }
  if (updates.periodStart !== undefined) {
    fields.push('period_start = ?')
    params.push(updates.periodStart)
  }
  if (updates.periodEnd !== undefined) {
    fields.push('period_end = ?')
    params.push(updates.periodEnd)
  }
  if (updates.dueDate !== undefined) {
    fields.push('due_date = ?')
    params.push(updates.dueDate ?? null)
  }
  if (updates.submittedDate !== undefined) {
    fields.push('submitted_date = ?')
    params.push(updates.submittedDate ?? null)
  }
  if (updates.status !== undefined) {
    fields.push('status = ?')
    params.push(updates.status)
  }
  if (updates.content !== undefined) {
    fields.push('content_json = ?')
    params.push(updates.content ? JSON.stringify(updates.content) : null)
  }
  if (updates.filePath !== undefined) {
    fields.push('file_path = ?')
    params.push(updates.filePath ?? null)
  }
  if (updates.notes !== undefined) {
    fields.push('notes = ?')
    params.push(updates.notes ?? null)
  }

  params.push(id)

  await db.run(`UPDATE umbrella_school_reports SET ${fields.join(', ')} WHERE id = ?`, ...params)

  return getReportById(id)
}

export async function deleteReport(id: string): Promise<void> {
  const db = await getDatabase()
  await db.run('DELETE FROM umbrella_school_reports WHERE id = ?', id)
}

export async function markReportSubmitted(id: string): Promise<UmbrellaSchoolReport | null> {
  const today = new Date().toISOString().split('T')[0]
  return updateReport(id, {
    status: 'submitted',
    submittedDate: today,
  })
}
