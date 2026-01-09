import { getDatabase } from '../connection'
import type { Subject, GradeLevel } from '../../types'

function rowToSubject(row: Record<string, unknown>): Subject {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    gradeLevels: JSON.parse(row.grade_levels as string) as GradeLevel[],
    createdAt: row.created_at as string,
  }
}

export async function getSubjects(): Promise<Subject[]> {
  const db = await getDatabase()
  const rows = await db.getAllAsync('SELECT * FROM subjects ORDER BY name') as Record<string, unknown>[]
  return rows.map(rowToSubject)
}

export async function getSubject(id: string): Promise<Subject | null> {
  const db = await getDatabase()
  const row = await db.getFirstAsync('SELECT * FROM subjects WHERE id = ?', id)
  return row ? rowToSubject(row as Record<string, unknown>) : null
}
