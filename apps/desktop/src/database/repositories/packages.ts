import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../connection'
import type {
  CurriculumPackage,
  CreateCurriculumPackage,
  UpdateCurriculumPackage,
  GradeLevel
} from '../../shared/types'

function rowToPackage(row: Record<string, unknown>): CurriculumPackage {
  return {
    id: row.id as string,
    name: row.name as string,
    publisher: row.publisher as string | undefined,
    subjectIds: row.subject_ids ? JSON.parse(row.subject_ids as string) : [],
    gradeLevels: row.grade_levels ? JSON.parse(row.grade_levels as string) : [],
    websiteUrl: row.website_url as string | undefined,
    notes: row.notes as string | undefined,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  }
}

export async function getCurriculumPackages(): Promise<CurriculumPackage[]> {
  const db = await getDatabase()
  const rows = await db.all('SELECT * FROM curriculum_packages ORDER BY name')
  return rows.map(rowToPackage)
}

export async function getCurriculumPackage(id: string): Promise<CurriculumPackage | null> {
  const db = await getDatabase()
  const rows = await db.all('SELECT * FROM curriculum_packages WHERE id = ?', id)
  return rows.length > 0 ? rowToPackage(rows[0]) : null
}

export async function createCurriculumPackage(data: CreateCurriculumPackage): Promise<CurriculumPackage> {
  const db = await getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  await db.run(
    `INSERT INTO curriculum_packages (id, name, publisher, subject_ids, grade_levels, website_url, notes, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.name,
    data.publisher || null,
    JSON.stringify(data.subjectIds || []),
    JSON.stringify(data.gradeLevels || []),
    data.websiteUrl || null,
    data.notes || null,
    data.isActive !== false ? 1 : 0,
    now,
    now
  )

  return (await getCurriculumPackage(id))!
}

export async function updateCurriculumPackage(
  id: string,
  data: UpdateCurriculumPackage
): Promise<CurriculumPackage> {
  const db = await getDatabase()
  const now = new Date().toISOString()

  const existing = await getCurriculumPackage(id)
  if (!existing) {
    throw new Error(`Curriculum package not found: ${id}`)
  }

  const updates: string[] = []
  const values: (string | number | null)[] = []

  if (data.name !== undefined) {
    updates.push('name = ?')
    values.push(data.name)
  }
  if (data.publisher !== undefined) {
    updates.push('publisher = ?')
    values.push(data.publisher || null)
  }
  if (data.subjectIds !== undefined) {
    updates.push('subject_ids = ?')
    values.push(JSON.stringify(data.subjectIds))
  }
  if (data.gradeLevels !== undefined) {
    updates.push('grade_levels = ?')
    values.push(JSON.stringify(data.gradeLevels))
  }
  if (data.websiteUrl !== undefined) {
    updates.push('website_url = ?')
    values.push(data.websiteUrl || null)
  }
  if (data.notes !== undefined) {
    updates.push('notes = ?')
    values.push(data.notes || null)
  }
  if (data.isActive !== undefined) {
    updates.push('is_active = ?')
    values.push(data.isActive ? 1 : 0)
  }

  if (updates.length > 0) {
    updates.push('updated_at = ?')
    values.push(now)
    values.push(id)

    await db.run(
      `UPDATE curriculum_packages SET ${updates.join(', ')} WHERE id = ?`,
      ...values
    )
  }

  return (await getCurriculumPackage(id))!
}

export async function deleteCurriculumPackage(id: string): Promise<void> {
  const db = await getDatabase()
  await db.run('DELETE FROM curriculum_packages WHERE id = ?', id)
}
