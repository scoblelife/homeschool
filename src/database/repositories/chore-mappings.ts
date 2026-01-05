import { getDatabase } from '../connection'
import { v4 as uuidv4 } from 'uuid'
import type { SubjectChoreMapping, CreateChoreMapping } from '../../shared/types'

interface MappingRow {
  id: string
  subject_id: string
  chore_name: string
  default_stars: number
  created_at: string
}

function rowToMapping(row: MappingRow): SubjectChoreMapping {
  return {
    id: row.id,
    subjectId: row.subject_id,
    choreName: row.chore_name,
    defaultStars: row.default_stars,
    createdAt: row.created_at
  }
}

/**
 * Get all subject-to-chore mappings
 */
export async function getChoreMappings(): Promise<SubjectChoreMapping[]> {
  const db = await getDatabase()
  const rows = await db.all<MappingRow>('SELECT * FROM subject_chore_mappings ORDER BY subject_id')
  return rows.map(rowToMapping)
}

/**
 * Get chore mapping for a specific subject
 */
export async function getChoreMapping(subjectId: string): Promise<SubjectChoreMapping | null> {
  const db = await getDatabase()
  const rows = await db.all<MappingRow>(
    'SELECT * FROM subject_chore_mappings WHERE subject_id = ?',
    subjectId
  )
  return rows.length > 0 ? rowToMapping(rows[0]) : null
}

/**
 * Create or update a chore mapping
 */
export async function upsertChoreMapping(data: CreateChoreMapping): Promise<SubjectChoreMapping> {
  const db = await getDatabase()
  const now = new Date().toISOString()

  // Check if mapping exists
  const existing = await getChoreMapping(data.subjectId)

  if (existing) {
    // Update existing
    await db.run(
      `UPDATE subject_chore_mappings
       SET chore_name = ?, default_stars = ?
       WHERE subject_id = ?`,
      data.choreName,
      data.defaultStars,
      data.subjectId
    )
    return { ...existing, choreName: data.choreName, defaultStars: data.defaultStars }
  } else {
    // Create new
    const id = uuidv4()
    await db.run(
      `INSERT INTO subject_chore_mappings (id, subject_id, chore_name, default_stars, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      id,
      data.subjectId,
      data.choreName,
      data.defaultStars,
      now
    )
    return {
      id,
      subjectId: data.subjectId,
      choreName: data.choreName,
      defaultStars: data.defaultStars,
      createdAt: now
    }
  }
}

/**
 * Delete a chore mapping
 */
export async function deleteChoreMapping(subjectId: string): Promise<void> {
  const db = await getDatabase()
  await db.run('DELETE FROM subject_chore_mappings WHERE subject_id = ?', subjectId)
}
