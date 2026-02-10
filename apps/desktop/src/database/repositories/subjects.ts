import { getDatabase } from '../connection'
import type { Subject, GradeLevel } from '../../shared/types'

function rowToSubject(row: Record<string, unknown>): Subject {
  const gradeLevels = typeof row.grade_levels === 'string'
    ? JSON.parse(row.grade_levels)
    : row.grade_levels
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    gradeLevels: gradeLevels as GradeLevel[],
    createdAt: row.created_at as string
  }
}

export async function getSubjects(): Promise<Subject[]> {
  const db = await getDatabase()
  const rows = await db.all('SELECT * FROM subjects ORDER BY name')
  return rows.map(rowToSubject)
}

export async function getSubject(id: string): Promise<Subject | null> {
  const db = await getDatabase()
  const rows = await db.all('SELECT * FROM subjects WHERE id = ?', id)
  return rows.length > 0 ? rowToSubject(rows[0]) : null
}
