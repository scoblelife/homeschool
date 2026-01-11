import { getDatabase } from '../connection'
import { v4 as uuidv4 } from 'uuid'
import type {
  ActivityStandardMapping,
  CustomStandard,
  CreateCustomStandard,
  UpdateCustomStandard,
  GradeLevel,
  LearningStandard,
  StandardCoverage,
  CurriculumReport
} from '../../shared/types'
import {
  ALL_LEARNING_STANDARDS,
  getStandardsByGrade,
  getStandardById as getBuiltInStandardById
} from '../../data/learningStandards'
import { emitSyncEvent } from '../syncEmitter'

// Get all learning standards (built-in + custom)
export async function getAllStandards(gradeLevel?: GradeLevel): Promise<LearningStandard[]> {
  const db = await getDatabase()

  // Get built-in standards
  let builtIn = gradeLevel
    ? getStandardsByGrade(gradeLevel)
    : ALL_LEARNING_STANDARDS

  // Get custom standards
  let query = 'SELECT * FROM custom_standards'
  const params: unknown[] = []
  if (gradeLevel) {
    query += ' WHERE grade_level = ?'
    params.push(gradeLevel)
  }

  const customRows = await db.all(query, ...params)
  const custom: LearningStandard[] = customRows.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    code: row.code as string,
    title: row.title as string,
    description: (row.description as string) || '',
    gradeLevel: row.grade_level as GradeLevel,
    subjectId: row.subject_id as string,
    domain: row.domain as string,
    standardSet: 'custom' as const
  }))

  return [...builtIn, ...custom]
}

// Get a specific standard by ID
export async function getStandard(id: string): Promise<LearningStandard | null> {
  // Try built-in first
  const builtIn = getBuiltInStandardById(id)
  if (builtIn) return builtIn

  // Try custom
  const db = await getDatabase()
  const rows = await db.all('SELECT * FROM custom_standards WHERE id = ?', id)
  if (rows.length === 0) return null

  const row = rows[0] as Record<string, unknown>
  return {
    id: row.id as string,
    code: row.code as string,
    title: row.title as string,
    description: (row.description as string) || '',
    gradeLevel: row.grade_level as GradeLevel,
    subjectId: row.subject_id as string,
    domain: row.domain as string,
    standardSet: 'custom' as const
  }
}

// Custom standards CRUD
export async function createCustomStandard(data: CreateCustomStandard): Promise<CustomStandard> {
  const db = await getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  await db.run(
    `INSERT INTO custom_standards (id, code, title, description, grade_level, subject_id, domain, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, data.code, data.title, data.description || null, data.gradeLevel, data.subjectId, data.domain, now, now
  )

  const standard: CustomStandard = {
    id,
    code: data.code,
    title: data.title,
    description: data.description,
    gradeLevel: data.gradeLevel,
    subjectId: data.subjectId,
    domain: data.domain,
    createdAt: now,
    updatedAt: now
  }

  // Emit sync event
  await emitSyncEvent({
    type: 'customStandard.created',
    data: {
      id,
      code: data.code,
      title: data.title,
      description: data.description,
      gradeLevel: data.gradeLevel,
      subjectId: data.subjectId,
      domain: data.domain
    }
  })

  return standard
}

export async function updateCustomStandard(id: string, data: UpdateCustomStandard): Promise<CustomStandard | null> {
  const db = await getDatabase()
  const now = new Date().toISOString()

  const updates: string[] = ['updated_at = ?']
  const params: unknown[] = [now]

  if (data.code !== undefined) {
    updates.push('code = ?')
    params.push(data.code)
  }
  if (data.title !== undefined) {
    updates.push('title = ?')
    params.push(data.title)
  }
  if (data.description !== undefined) {
    updates.push('description = ?')
    params.push(data.description)
  }
  if (data.domain !== undefined) {
    updates.push('domain = ?')
    params.push(data.domain)
  }

  params.push(id)

  await db.run(
    `UPDATE custom_standards SET ${updates.join(', ')} WHERE id = ?`,
    ...params
  )

  const rows = await db.all('SELECT * FROM custom_standards WHERE id = ?', id)
  if (rows.length === 0) return null

  const row = rows[0] as Record<string, unknown>
  const standard: CustomStandard = {
    id: row.id as string,
    code: row.code as string,
    title: row.title as string,
    description: row.description as string | undefined,
    gradeLevel: row.grade_level as GradeLevel,
    subjectId: row.subject_id as string,
    domain: row.domain as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  }

  // Emit sync event
  await emitSyncEvent({
    type: 'customStandard.updated',
    data: { id, ...data }
  })

  return standard
}

export async function deleteCustomStandard(id: string): Promise<void> {
  const db = await getDatabase()

  // Also delete any mappings to this standard
  await db.run('DELETE FROM activity_standards WHERE standard_id = ?', id)
  await db.run('DELETE FROM custom_standards WHERE id = ?', id)

  // Emit sync event
  await emitSyncEvent({
    type: 'customStandard.deleted',
    data: { id }
  })
}

// Activity-Standard Mappings
export async function getActivityStandards(activityId: string): Promise<LearningStandard[]> {
  const db = await getDatabase()
  const rows = await db.all(
    'SELECT standard_id FROM activity_standards WHERE activity_id = ?',
    activityId
  )

  const standards: LearningStandard[] = []
  for (const row of rows) {
    const standard = await getStandard((row as { standard_id: string }).standard_id)
    if (standard) standards.push(standard)
  }

  return standards
}

export async function addActivityStandard(activityId: string, standardId: string): Promise<ActivityStandardMapping> {
  const db = await getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  await db.run(
    `INSERT OR IGNORE INTO activity_standards (id, activity_id, standard_id, created_at)
     VALUES (?, ?, ?, ?)`,
    id, activityId, standardId, now
  )

  // Emit sync event
  await emitSyncEvent({
    type: 'activityStandard.created',
    data: { id, activityId, standardId }
  })

  return { id, activityId, standardId, createdAt: now }
}

export async function removeActivityStandard(activityId: string, standardId: string): Promise<void> {
  const db = await getDatabase()
  await db.run(
    'DELETE FROM activity_standards WHERE activity_id = ? AND standard_id = ?',
    activityId, standardId
  )

  // Emit sync event
  await emitSyncEvent({
    type: 'activityStandard.deleted',
    data: { activityId, standardId }
  })
}

export async function setActivityStandards(activityId: string, standardIds: string[]): Promise<void> {
  const db = await getDatabase()

  // Get current standards
  const currentRows = await db.all<{ standard_id: string }>(
    'SELECT standard_id FROM activity_standards WHERE activity_id = ?',
    activityId
  )
  const currentIdsArray = currentRows.map((r) => r.standard_id)
  const currentIds = new Set(currentIdsArray)

  // Remove standards not in new list
  for (const currentId of currentIdsArray) {
    if (!standardIds.includes(currentId)) {
      await removeActivityStandard(activityId, currentId)
    }
  }

  // Add new standards
  for (const standardId of standardIds) {
    if (!currentIds.has(standardId)) {
      await addActivityStandard(activityId, standardId)
    }
  }
}

// Coverage Report
export async function getStandardCoverage(
  studentId: string,
  gradeLevel: GradeLevel,
  startDate?: string,
  endDate?: string
): Promise<StandardCoverage[]> {
  const db = await getDatabase()
  const standards = await getAllStandards(gradeLevel)

  const coverage: StandardCoverage[] = []

  for (const standard of standards) {
    let query = `
      SELECT COUNT(*) as count, SUM(a.duration_minutes) as minutes, MAX(a.date_completed) as last_date
      FROM activities a
      JOIN activity_standards asm ON a.id = asm.activity_id
      WHERE asm.standard_id = ? AND a.student_id = ?
    `
    const params: unknown[] = [standard.id, studentId]

    if (startDate) {
      query += ' AND a.date_completed >= ?'
      params.push(startDate)
    }
    if (endDate) {
      query += ' AND a.date_completed <= ?'
      params.push(endDate)
    }

    const rows = await db.all(query, ...params)
    const row = rows[0] as { count: number; minutes: number | null; last_date: string | null }

    coverage.push({
      standard,
      activityCount: row.count,
      totalMinutes: row.minutes || 0,
      lastActivity: row.last_date || undefined
    })
  }

  return coverage
}

// Full curriculum report
export async function getCurriculumReport(
  studentId: string,
  gradeLevel: GradeLevel,
  startDate?: string,
  endDate?: string
): Promise<CurriculumReport> {
  const db = await getDatabase()
  const coverage = await getStandardCoverage(studentId, gradeLevel, startDate, endDate)

  // Get subjects
  const subjects = await db.all('SELECT id, name FROM subjects')
  const subjectMap = new Map<string, string>()
  for (const s of subjects) {
    subjectMap.set((s as { id: string; name: string }).id, (s as { id: string; name: string }).name)
  }

  // Calculate totals
  const totalStandards = coverage.length
  const coveredStandards = coverage.filter(c => c.activityCount > 0).length
  const coveragePercent = totalStandards > 0 ? Math.round((coveredStandards / totalStandards) * 100) : 0

  // Group by subject
  const bySubjectMap = new Map<string, { total: number; covered: number }>()
  for (const c of coverage) {
    const current = bySubjectMap.get(c.standard.subjectId) || { total: 0, covered: 0 }
    current.total++
    if (c.activityCount > 0) current.covered++
    bySubjectMap.set(c.standard.subjectId, current)
  }

  const bySubject = Array.from(bySubjectMap.entries()).map(([subjectId, data]) => ({
    subjectId,
    subjectName: subjectMap.get(subjectId) || subjectId,
    total: data.total,
    covered: data.covered,
    coveragePercent: data.total > 0 ? Math.round((data.covered / data.total) * 100) : 0
  }))

  // Group by domain
  const byDomainMap = new Map<string, { total: number; covered: number }>()
  for (const c of coverage) {
    const current = byDomainMap.get(c.standard.domain) || { total: 0, covered: 0 }
    current.total++
    if (c.activityCount > 0) current.covered++
    byDomainMap.set(c.standard.domain, current)
  }

  const byDomain = Array.from(byDomainMap.entries()).map(([domain, data]) => ({
    domain,
    total: data.total,
    covered: data.covered,
    coveragePercent: data.total > 0 ? Math.round((data.covered / data.total) * 100) : 0
  }))

  // Uncovered standards
  const uncoveredStandards = coverage
    .filter(c => c.activityCount === 0)
    .map(c => c.standard)

  return {
    gradeLevel,
    totalStandards,
    coveredStandards,
    coveragePercent,
    bySubject,
    byDomain,
    uncoveredStandards
  }
}
