import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../connection'
import type {
  CoopGroup,
  CreateCoopGroup,
  UpdateCoopGroup,
  CoopMember,
  CreateCoopMember,
  UpdateCoopMember,
  CoopMemberRole,
  CoopEvent,
  CreateCoopEvent,
  UpdateCoopEvent,
  CoopSharingPreferences,
  UpdateCoopSharingPreferences
} from '../../shared/types'

// Generate a 6-character invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude confusing chars like 0/O, 1/I
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// ============================================================================
// Co-op Groups
// ============================================================================

function rowToCoopGroup(row: Record<string, unknown>): CoopGroup {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string | undefined,
    inviteCode: row.invite_code as string,
    createdBy: row.created_by as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  }
}

export async function getCoopGroups(): Promise<CoopGroup[]> {
  const db = await getDatabase()
  const rows = await db.all<Record<string, unknown>>(
    'SELECT * FROM coop_groups ORDER BY name'
  )
  return rows.map(rowToCoopGroup)
}

export async function getCoopGroup(id: string): Promise<CoopGroup | null> {
  const db = await getDatabase()
  const rows = await db.all<Record<string, unknown>>(
    'SELECT * FROM coop_groups WHERE id = ?',
    id
  )
  return rows.length > 0 ? rowToCoopGroup(rows[0]) : null
}

export async function getCoopGroupByInviteCode(inviteCode: string): Promise<CoopGroup | null> {
  const db = await getDatabase()
  const rows = await db.all<Record<string, unknown>>(
    'SELECT * FROM coop_groups WHERE invite_code = ?',
    inviteCode.toUpperCase()
  )
  return rows.length > 0 ? rowToCoopGroup(rows[0]) : null
}

export async function createCoopGroup(data: CreateCoopGroup): Promise<CoopGroup> {
  const db = await getDatabase()
  const id = uuidv4()
  const inviteCode = generateInviteCode()

  await db.run(
    `INSERT INTO coop_groups (id, name, description, invite_code, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    id,
    data.name,
    data.description,
    inviteCode,
    data.createdBy
  )

  const rows = await db.all<Record<string, unknown>>(
    'SELECT * FROM coop_groups WHERE id = ?',
    id
  )
  return rowToCoopGroup(rows[0])
}

export async function updateCoopGroup(id: string, data: UpdateCoopGroup): Promise<CoopGroup> {
  const db = await getDatabase()

  const updates: string[] = []
  const values: unknown[] = []

  if (data.name !== undefined) {
    updates.push('name = ?')
    values.push(data.name)
  }
  if (data.description !== undefined) {
    updates.push('description = ?')
    values.push(data.description)
  }

  updates.push('updated_at = CURRENT_TIMESTAMP')
  values.push(id)

  await db.run(
    `UPDATE coop_groups SET ${updates.join(', ')} WHERE id = ?`,
    ...values
  )

  const rows = await db.all<Record<string, unknown>>(
    'SELECT * FROM coop_groups WHERE id = ?',
    id
  )
  return rowToCoopGroup(rows[0])
}

export async function deleteCoopGroup(id: string): Promise<void> {
  const db = await getDatabase()
  // Delete all members and events first
  await db.run('DELETE FROM coop_events WHERE group_id = ?', id)
  await db.run('DELETE FROM coop_members WHERE group_id = ?', id)
  await db.run('DELETE FROM coop_groups WHERE id = ?', id)
}

export async function regenerateInviteCode(groupId: string): Promise<string> {
  const db = await getDatabase()
  const newCode = generateInviteCode()

  await db.run(
    'UPDATE coop_groups SET invite_code = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    newCode,
    groupId
  )

  return newCode
}

// ============================================================================
// Co-op Members
// ============================================================================

function rowToCoopMember(row: Record<string, unknown>): CoopMember {
  return {
    id: row.id as string,
    groupId: row.group_id as string,
    familyName: row.family_name as string,
    email: row.email as string | undefined,
    phone: row.phone as string | undefined,
    role: row.role as CoopMemberRole,
    joinedAt: row.joined_at as string
  }
}

export async function getCoopMembers(groupId: string): Promise<CoopMember[]> {
  const db = await getDatabase()
  const rows = await db.all<Record<string, unknown>>(
    'SELECT * FROM coop_members WHERE group_id = ? ORDER BY family_name',
    groupId
  )
  return rows.map(rowToCoopMember)
}

export async function getCoopMember(id: string): Promise<CoopMember | null> {
  const db = await getDatabase()
  const rows = await db.all<Record<string, unknown>>(
    'SELECT * FROM coop_members WHERE id = ?',
    id
  )
  return rows.length > 0 ? rowToCoopMember(rows[0]) : null
}

export async function createCoopMember(data: CreateCoopMember): Promise<CoopMember> {
  const db = await getDatabase()
  const id = uuidv4()

  await db.run(
    `INSERT INTO coop_members (id, group_id, family_name, email, phone, role)
     VALUES (?, ?, ?, ?, ?, ?)`,
    id,
    data.groupId,
    data.familyName,
    data.email,
    data.phone,
    data.role
  )

  const rows = await db.all<Record<string, unknown>>(
    'SELECT * FROM coop_members WHERE id = ?',
    id
  )
  return rowToCoopMember(rows[0])
}

export async function updateCoopMember(id: string, data: UpdateCoopMember): Promise<CoopMember> {
  const db = await getDatabase()

  const updates: string[] = []
  const values: unknown[] = []

  if (data.familyName !== undefined) {
    updates.push('family_name = ?')
    values.push(data.familyName)
  }
  if (data.email !== undefined) {
    updates.push('email = ?')
    values.push(data.email)
  }
  if (data.phone !== undefined) {
    updates.push('phone = ?')
    values.push(data.phone)
  }
  if (data.role !== undefined) {
    updates.push('role = ?')
    values.push(data.role)
  }

  values.push(id)

  if (updates.length > 0) {
    await db.run(
      `UPDATE coop_members SET ${updates.join(', ')} WHERE id = ?`,
      ...values
    )
  }

  const rows = await db.all<Record<string, unknown>>(
    'SELECT * FROM coop_members WHERE id = ?',
    id
  )
  return rowToCoopMember(rows[0])
}

export async function deleteCoopMember(id: string): Promise<void> {
  const db = await getDatabase()
  await db.run('DELETE FROM coop_members WHERE id = ?', id)
}

// ============================================================================
// Co-op Events
// ============================================================================

function rowToCoopEvent(row: Record<string, unknown>): CoopEvent {
  return {
    id: row.id as string,
    groupId: row.group_id as string,
    fieldTripId: row.field_trip_id as string | undefined,
    title: row.title as string,
    description: row.description as string | undefined,
    location: row.location as string,
    date: row.date as string,
    startTime: row.start_time as string | undefined,
    endTime: row.end_time as string | undefined,
    organizerId: row.organizer_id as string,
    maxAttendees: row.max_attendees as number | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  }
}

export async function getCoopEvents(groupId: string): Promise<CoopEvent[]> {
  const db = await getDatabase()
  const rows = await db.all<Record<string, unknown>>(
    'SELECT * FROM coop_events WHERE group_id = ? ORDER BY date DESC',
    groupId
  )
  return rows.map(rowToCoopEvent)
}

export async function getCoopEvent(id: string): Promise<CoopEvent | null> {
  const db = await getDatabase()
  const rows = await db.all<Record<string, unknown>>(
    'SELECT * FROM coop_events WHERE id = ?',
    id
  )
  return rows.length > 0 ? rowToCoopEvent(rows[0]) : null
}

export async function createCoopEvent(data: CreateCoopEvent): Promise<CoopEvent> {
  const db = await getDatabase()
  const id = uuidv4()

  await db.run(
    `INSERT INTO coop_events (id, group_id, field_trip_id, title, description, location, date, start_time, end_time, organizer_id, max_attendees)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.groupId,
    data.fieldTripId,
    data.title,
    data.description,
    data.location,
    data.date,
    data.startTime,
    data.endTime,
    data.organizerId,
    data.maxAttendees
  )

  const rows = await db.all<Record<string, unknown>>(
    'SELECT * FROM coop_events WHERE id = ?',
    id
  )
  return rowToCoopEvent(rows[0])
}

export async function updateCoopEvent(id: string, data: UpdateCoopEvent): Promise<CoopEvent> {
  const db = await getDatabase()

  const updates: string[] = []
  const values: unknown[] = []

  if (data.fieldTripId !== undefined) {
    updates.push('field_trip_id = ?')
    values.push(data.fieldTripId)
  }
  if (data.title !== undefined) {
    updates.push('title = ?')
    values.push(data.title)
  }
  if (data.description !== undefined) {
    updates.push('description = ?')
    values.push(data.description)
  }
  if (data.location !== undefined) {
    updates.push('location = ?')
    values.push(data.location)
  }
  if (data.date !== undefined) {
    updates.push('date = ?')
    values.push(data.date)
  }
  if (data.startTime !== undefined) {
    updates.push('start_time = ?')
    values.push(data.startTime)
  }
  if (data.endTime !== undefined) {
    updates.push('end_time = ?')
    values.push(data.endTime)
  }
  if (data.organizerId !== undefined) {
    updates.push('organizer_id = ?')
    values.push(data.organizerId)
  }
  if (data.maxAttendees !== undefined) {
    updates.push('max_attendees = ?')
    values.push(data.maxAttendees)
  }

  updates.push('updated_at = CURRENT_TIMESTAMP')
  values.push(id)

  await db.run(
    `UPDATE coop_events SET ${updates.join(', ')} WHERE id = ?`,
    ...values
  )

  const rows = await db.all<Record<string, unknown>>(
    'SELECT * FROM coop_events WHERE id = ?',
    id
  )
  return rowToCoopEvent(rows[0])
}

export async function deleteCoopEvent(id: string): Promise<void> {
  const db = await getDatabase()
  await db.run('DELETE FROM coop_events WHERE id = ?', id)
}

// ============================================================================
// Co-op Sharing Preferences
// ============================================================================

function rowToCoopSharingPreferences(row: Record<string, unknown>): CoopSharingPreferences {
  return {
    id: row.id as string,
    groupId: row.group_id as string,
    shareEvents: Boolean(row.share_events),
    shareResources: Boolean(row.share_resources),
    shareReadingLists: Boolean(row.share_reading_lists),
    sharePackages: Boolean(row.share_packages),
    updatedAt: row.updated_at as string
  }
}

export async function getCoopSharingPreferences(groupId: string): Promise<CoopSharingPreferences | null> {
  const db = await getDatabase()
  const rows = await db.all<Record<string, unknown>>(
    'SELECT * FROM coop_sharing_preferences WHERE group_id = ?',
    groupId
  )
  return rows.length > 0 ? rowToCoopSharingPreferences(rows[0]) : null
}

export async function createCoopSharingPreferences(groupId: string): Promise<CoopSharingPreferences> {
  const db = await getDatabase()
  const id = uuidv4()

  await db.run(
    `INSERT INTO coop_sharing_preferences (id, group_id, share_events, share_resources, share_reading_lists, share_packages)
     VALUES (?, ?, TRUE, FALSE, FALSE, FALSE)`,
    id,
    groupId
  )

  const rows = await db.all<Record<string, unknown>>(
    'SELECT * FROM coop_sharing_preferences WHERE id = ?',
    id
  )
  return rowToCoopSharingPreferences(rows[0])
}

export async function updateCoopSharingPreferences(
  groupId: string,
  data: UpdateCoopSharingPreferences
): Promise<CoopSharingPreferences> {
  const db = await getDatabase()

  // Check if preferences exist, create if not
  let prefs = await getCoopSharingPreferences(groupId)
  if (!prefs) {
    prefs = await createCoopSharingPreferences(groupId)
  }

  const updates: string[] = []
  const values: unknown[] = []

  if (data.shareEvents !== undefined) {
    updates.push('share_events = ?')
    values.push(data.shareEvents)
  }
  if (data.shareResources !== undefined) {
    updates.push('share_resources = ?')
    values.push(data.shareResources)
  }
  if (data.shareReadingLists !== undefined) {
    updates.push('share_reading_lists = ?')
    values.push(data.shareReadingLists)
  }
  if (data.sharePackages !== undefined) {
    updates.push('share_packages = ?')
    values.push(data.sharePackages)
  }

  if (updates.length > 0) {
    updates.push('updated_at = CURRENT_TIMESTAMP')
    values.push(groupId)

    await db.run(
      `UPDATE coop_sharing_preferences SET ${updates.join(', ')} WHERE group_id = ?`,
      ...values
    )
  }

  const rows = await db.all<Record<string, unknown>>(
    'SELECT * FROM coop_sharing_preferences WHERE group_id = ?',
    groupId
  )
  return rowToCoopSharingPreferences(rows[0])
}

export async function getOrCreateCoopSharingPreferences(groupId: string): Promise<CoopSharingPreferences> {
  let prefs = await getCoopSharingPreferences(groupId)
  if (!prefs) {
    prefs = await createCoopSharingPreferences(groupId)
  }
  return prefs
}
