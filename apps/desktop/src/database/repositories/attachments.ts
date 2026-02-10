/**
 * Activity Attachments Repository
 *
 * CRUD operations for activity photo attachments.
 */

import { getDatabase } from '../connection'
import { v4 as uuidv4 } from 'uuid'
import type { ActivityAttachment, CreateAttachment } from '../../shared/types'

interface AttachmentRow {
  id: string
  activity_id: string
  file_path: string
  thumbnail_path: string | null
  file_name: string
  file_type: string
  file_size: number | null
  width: number | null
  height: number | null
  created_at: string
}

function rowToAttachment(row: AttachmentRow): ActivityAttachment {
  return {
    id: row.id,
    activityId: row.activity_id,
    filePath: row.file_path,
    thumbnailPath: row.thumbnail_path,
    fileName: row.file_name,
    fileType: row.file_type,
    fileSize: row.file_size,
    width: row.width,
    height: row.height,
    createdAt: row.created_at
  }
}

export async function getAttachments(activityId: string): Promise<ActivityAttachment[]> {
  const db = await getDatabase()
  const rows = await db.all<AttachmentRow>(
    'SELECT * FROM activity_attachments WHERE activity_id = ? ORDER BY created_at ASC',
    activityId
  )
  return rows.map(rowToAttachment)
}

export async function getAttachment(id: string): Promise<ActivityAttachment | null> {
  const db = await getDatabase()
  const rows = await db.all<AttachmentRow>(
    'SELECT * FROM activity_attachments WHERE id = ?',
    id
  )
  return rows.length > 0 ? rowToAttachment(rows[0]) : null
}

export async function createAttachment(data: CreateAttachment): Promise<ActivityAttachment> {
  const db = await getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  await db.run(
    `INSERT INTO activity_attachments (
      id, activity_id, file_path, file_name, file_type, file_size, width, height, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.activityId,
    data.filePath,
    data.fileName,
    data.fileType,
    data.fileSize,
    data.width,
    data.height,
    now
  )

  const created = await getAttachment(id)
  if (!created) throw new Error('Failed to create attachment')
  return created
}

export async function updateThumbnailPath(id: string, thumbnailPath: string): Promise<void> {
  const db = await getDatabase()
  await db.run(
    'UPDATE activity_attachments SET thumbnail_path = ? WHERE id = ?',
    thumbnailPath,
    id
  )
}

export async function deleteAttachment(id: string): Promise<boolean> {
  const db = await getDatabase()
  const existing = await getAttachment(id)
  if (!existing) return false

  await db.run('DELETE FROM activity_attachments WHERE id = ?', id)
  return true
}

export async function getAttachmentsForActivities(activityIds: string[]): Promise<Map<string, ActivityAttachment[]>> {
  if (activityIds.length === 0) return new Map()

  const db = await getDatabase()
  const placeholders = activityIds.map(() => '?').join(',')
  const rows = await db.all<AttachmentRow>(
    `SELECT * FROM activity_attachments WHERE activity_id IN (${placeholders}) ORDER BY created_at ASC`,
    ...activityIds
  )

  const result = new Map<string, ActivityAttachment[]>()
  for (const row of rows) {
    const attachment = rowToAttachment(row)
    const existing = result.get(attachment.activityId) || []
    existing.push(attachment)
    result.set(attachment.activityId, existing)
  }

  return result
}
