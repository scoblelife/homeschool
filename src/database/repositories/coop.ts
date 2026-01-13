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
  UpdateCoopSharingPreferences,
  SharedResource,
  CreateSharedResource,
  UpdateSharedResource,
  SharedResourceType,
  ResourceRating,
  CreateResourceRating,
  MentorProfile,
  CreateMentorProfile,
  UpdateMentorProfile,
  MentorExpertise,
  MentorRequest,
  CreateMentorRequest,
  MentorRequestStatus
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

// Get all upcoming events across all groups for discovery
export async function getAllUpcomingCoopEvents(): Promise<(CoopEvent & { groupName: string; organizerName: string })[]> {
  const db = await getDatabase()
  const today = new Date().toISOString().split('T')[0]
  const rows = await db.all<Record<string, unknown>>(
    `SELECT e.*, g.name as group_name, m.family_name as organizer_name
     FROM coop_events e
     JOIN coop_groups g ON e.group_id = g.id
     LEFT JOIN coop_members m ON e.organizer_id = m.id
     WHERE e.date >= ?
     ORDER BY e.date ASC`,
    today
  )
  return rows.map(row => ({
    ...rowToCoopEvent(row),
    groupName: row.group_name as string,
    organizerName: row.organizer_name as string || 'Unknown'
  }))
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

// ============================================================================
// Shared Resources
// ============================================================================

function rowToSharedResource(row: Record<string, unknown>): SharedResource {
  return {
    id: row.id as string,
    groupId: row.group_id as string,
    sharedBy: row.shared_by as string,
    resourceType: row.resource_type as SharedResourceType,
    title: row.title as string,
    description: row.description as string | undefined,
    url: row.url as string | undefined,
    subject: row.subject as string | undefined,
    gradeLevel: row.grade_level as string | undefined,
    averageRating: Number(row.average_rating) || 0,
    ratingCount: Number(row.rating_count) || 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  }
}

export async function getSharedResources(groupId: string): Promise<(SharedResource & { sharedByName: string })[]> {
  const db = await getDatabase()
  const rows = await db.all<Record<string, unknown>>(
    `SELECT r.*, m.family_name as shared_by_name
     FROM shared_resources r
     LEFT JOIN coop_members m ON r.shared_by = m.id
     WHERE r.group_id = ?
     ORDER BY r.created_at DESC`,
    groupId
  )
  return rows.map(row => ({
    ...rowToSharedResource(row),
    sharedByName: row.shared_by_name as string || 'Unknown'
  }))
}

export async function getAllSharedResources(): Promise<(SharedResource & { groupName: string; sharedByName: string })[]> {
  const db = await getDatabase()
  const rows = await db.all<Record<string, unknown>>(
    `SELECT r.*, g.name as group_name, m.family_name as shared_by_name
     FROM shared_resources r
     JOIN coop_groups g ON r.group_id = g.id
     LEFT JOIN coop_members m ON r.shared_by = m.id
     ORDER BY r.created_at DESC`
  )
  return rows.map(row => ({
    ...rowToSharedResource(row),
    groupName: row.group_name as string,
    sharedByName: row.shared_by_name as string || 'Unknown'
  }))
}

export async function getSharedResource(id: string): Promise<SharedResource | null> {
  const db = await getDatabase()
  const rows = await db.all<Record<string, unknown>>(
    'SELECT * FROM shared_resources WHERE id = ?',
    id
  )
  return rows.length > 0 ? rowToSharedResource(rows[0]) : null
}

export async function createSharedResource(data: CreateSharedResource): Promise<SharedResource> {
  const db = await getDatabase()
  const id = uuidv4()

  await db.run(
    `INSERT INTO shared_resources (id, group_id, shared_by, resource_type, title, description, url, subject, grade_level)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.groupId,
    data.sharedBy,
    data.resourceType,
    data.title,
    data.description,
    data.url,
    data.subject,
    data.gradeLevel
  )

  const rows = await db.all<Record<string, unknown>>(
    'SELECT * FROM shared_resources WHERE id = ?',
    id
  )
  return rowToSharedResource(rows[0])
}

export async function updateSharedResource(id: string, data: UpdateSharedResource): Promise<SharedResource> {
  const db = await getDatabase()

  const updates: string[] = []
  const values: unknown[] = []

  if (data.resourceType !== undefined) {
    updates.push('resource_type = ?')
    values.push(data.resourceType)
  }
  if (data.title !== undefined) {
    updates.push('title = ?')
    values.push(data.title)
  }
  if (data.description !== undefined) {
    updates.push('description = ?')
    values.push(data.description)
  }
  if (data.url !== undefined) {
    updates.push('url = ?')
    values.push(data.url)
  }
  if (data.subject !== undefined) {
    updates.push('subject = ?')
    values.push(data.subject)
  }
  if (data.gradeLevel !== undefined) {
    updates.push('grade_level = ?')
    values.push(data.gradeLevel)
  }

  if (updates.length > 0) {
    updates.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)

    await db.run(
      `UPDATE shared_resources SET ${updates.join(', ')} WHERE id = ?`,
      ...values
    )
  }

  const rows = await db.all<Record<string, unknown>>(
    'SELECT * FROM shared_resources WHERE id = ?',
    id
  )
  return rowToSharedResource(rows[0])
}

export async function deleteSharedResource(id: string): Promise<void> {
  const db = await getDatabase()
  await db.run('DELETE FROM resource_ratings WHERE resource_id = ?', id)
  await db.run('DELETE FROM shared_resources WHERE id = ?', id)
}

// ============================================================================
// Resource Ratings
// ============================================================================

function rowToResourceRating(row: Record<string, unknown>): ResourceRating {
  return {
    id: row.id as string,
    resourceId: row.resource_id as string,
    memberId: row.member_id as string,
    rating: Number(row.rating),
    review: row.review as string | undefined,
    createdAt: row.created_at as string
  }
}

export async function getResourceRatings(resourceId: string): Promise<(ResourceRating & { memberName: string })[]> {
  const db = await getDatabase()
  const rows = await db.all<Record<string, unknown>>(
    `SELECT rr.*, m.family_name as member_name
     FROM resource_ratings rr
     LEFT JOIN coop_members m ON rr.member_id = m.id
     WHERE rr.resource_id = ?
     ORDER BY rr.created_at DESC`,
    resourceId
  )
  return rows.map(row => ({
    ...rowToResourceRating(row),
    memberName: row.member_name as string || 'Unknown'
  }))
}

export async function createResourceRating(data: CreateResourceRating): Promise<ResourceRating> {
  const db = await getDatabase()
  const id = uuidv4()

  // Insert or update rating (one rating per member per resource)
  await db.run(
    `INSERT INTO resource_ratings (id, resource_id, member_id, rating, review)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (resource_id, member_id) DO UPDATE SET
       rating = excluded.rating,
       review = excluded.review`,
    id,
    data.resourceId,
    data.memberId,
    data.rating,
    data.review
  )

  // Update average rating on the resource
  await updateResourceAverageRating(data.resourceId)

  const rows = await db.all<Record<string, unknown>>(
    'SELECT * FROM resource_ratings WHERE resource_id = ? AND member_id = ?',
    data.resourceId,
    data.memberId
  )
  return rowToResourceRating(rows[0])
}

export async function deleteResourceRating(id: string): Promise<void> {
  const db = await getDatabase()

  // Get the resource ID before deleting
  const rows = await db.all<Record<string, unknown>>(
    'SELECT resource_id FROM resource_ratings WHERE id = ?',
    id
  )

  if (rows.length > 0) {
    const resourceId = rows[0].resource_id as string
    await db.run('DELETE FROM resource_ratings WHERE id = ?', id)
    // Update average rating
    await updateResourceAverageRating(resourceId)
  }
}

async function updateResourceAverageRating(resourceId: string): Promise<void> {
  const db = await getDatabase()

  const result = await db.all<Record<string, unknown>>(
    `SELECT AVG(rating) as avg_rating, COUNT(*) as count
     FROM resource_ratings
     WHERE resource_id = ?`,
    resourceId
  )

  const avgRating = result[0]?.avg_rating || 0
  const count = result[0]?.count || 0

  await db.run(
    `UPDATE shared_resources
     SET average_rating = ?, rating_count = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    avgRating,
    count,
    resourceId
  )
}

// ============================================================================
// Mentor Matching
// ============================================================================

function rowToMentorProfile(row: Record<string, unknown>): MentorProfile {
  return {
    id: row.id as string,
    memberId: row.member_id as string,
    yearsHomeschooling: Number(row.years_homeschooling),
    expertise: JSON.parse(row.expertise as string || '[]') as MentorExpertise[],
    bio: row.bio as string,
    maxMentees: Number(row.max_mentees),
    currentMenteeCount: Number(row.current_mentee_count),
    isAcceptingRequests: Boolean(row.is_accepting_requests),
    contactEmail: row.contact_email as string | undefined,
    contactPhone: row.contact_phone as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  }
}

export async function getMentorProfiles(): Promise<(MentorProfile & { memberName: string; groupName: string })[]> {
  const db = await getDatabase()
  const rows = await db.all<Record<string, unknown>>(
    `SELECT mp.*, m.family_name as member_name, g.name as group_name
     FROM mentor_profiles mp
     JOIN coop_members m ON mp.member_id = m.id
     JOIN coop_groups g ON m.group_id = g.id
     WHERE mp.is_accepting_requests = TRUE
     ORDER BY mp.years_homeschooling DESC`
  )
  return rows.map(row => ({
    ...rowToMentorProfile(row),
    memberName: row.member_name as string,
    groupName: row.group_name as string
  }))
}

export async function getMentorProfile(id: string): Promise<MentorProfile | null> {
  const db = await getDatabase()
  const rows = await db.all<Record<string, unknown>>(
    'SELECT * FROM mentor_profiles WHERE id = ?',
    id
  )
  return rows.length > 0 ? rowToMentorProfile(rows[0]) : null
}

export async function getMyMentorProfile(memberId: string): Promise<MentorProfile | null> {
  const db = await getDatabase()
  const rows = await db.all<Record<string, unknown>>(
    'SELECT * FROM mentor_profiles WHERE member_id = ?',
    memberId
  )
  return rows.length > 0 ? rowToMentorProfile(rows[0]) : null
}

export async function createMentorProfile(data: CreateMentorProfile): Promise<MentorProfile> {
  const db = await getDatabase()
  const id = uuidv4()

  await db.run(
    `INSERT INTO mentor_profiles (id, member_id, years_homeschooling, expertise, bio, max_mentees, is_accepting_requests, contact_email, contact_phone)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.memberId,
    data.yearsHomeschooling,
    JSON.stringify(data.expertise),
    data.bio,
    data.maxMentees,
    data.isAcceptingRequests,
    data.contactEmail,
    data.contactPhone
  )

  const rows = await db.all<Record<string, unknown>>(
    'SELECT * FROM mentor_profiles WHERE id = ?',
    id
  )
  return rowToMentorProfile(rows[0])
}

export async function updateMentorProfile(id: string, data: UpdateMentorProfile): Promise<MentorProfile> {
  const db = await getDatabase()

  const updates: string[] = []
  const values: unknown[] = []

  if (data.yearsHomeschooling !== undefined) {
    updates.push('years_homeschooling = ?')
    values.push(data.yearsHomeschooling)
  }
  if (data.expertise !== undefined) {
    updates.push('expertise = ?')
    values.push(JSON.stringify(data.expertise))
  }
  if (data.bio !== undefined) {
    updates.push('bio = ?')
    values.push(data.bio)
  }
  if (data.maxMentees !== undefined) {
    updates.push('max_mentees = ?')
    values.push(data.maxMentees)
  }
  if (data.isAcceptingRequests !== undefined) {
    updates.push('is_accepting_requests = ?')
    values.push(data.isAcceptingRequests)
  }
  if (data.contactEmail !== undefined) {
    updates.push('contact_email = ?')
    values.push(data.contactEmail)
  }
  if (data.contactPhone !== undefined) {
    updates.push('contact_phone = ?')
    values.push(data.contactPhone)
  }

  if (updates.length > 0) {
    updates.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)

    await db.run(
      `UPDATE mentor_profiles SET ${updates.join(', ')} WHERE id = ?`,
      ...values
    )
  }

  const rows = await db.all<Record<string, unknown>>(
    'SELECT * FROM mentor_profiles WHERE id = ?',
    id
  )
  return rowToMentorProfile(rows[0])
}

export async function deleteMentorProfile(id: string): Promise<void> {
  const db = await getDatabase()
  await db.run('DELETE FROM mentor_requests WHERE mentor_id = ?', id)
  await db.run('DELETE FROM mentor_profiles WHERE id = ?', id)
}

// ============================================================================
// Mentor Requests
// ============================================================================

function rowToMentorRequest(row: Record<string, unknown>): MentorRequest {
  return {
    id: row.id as string,
    mentorId: row.mentor_id as string,
    requesterId: row.requester_id as string,
    message: row.message as string,
    status: row.status as MentorRequestStatus,
    responseMessage: row.response_message as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  }
}

export async function getMentorRequests(mentorId: string): Promise<(MentorRequest & { requesterName: string })[]> {
  const db = await getDatabase()
  const rows = await db.all<Record<string, unknown>>(
    `SELECT mr.*, m.family_name as requester_name
     FROM mentor_requests mr
     JOIN coop_members m ON mr.requester_id = m.id
     WHERE mr.mentor_id = ?
     ORDER BY mr.created_at DESC`,
    mentorId
  )
  return rows.map(row => ({
    ...rowToMentorRequest(row),
    requesterName: row.requester_name as string
  }))
}

export async function getMyMentorRequests(requesterId: string): Promise<(MentorRequest & { mentorName: string })[]> {
  const db = await getDatabase()
  const rows = await db.all<Record<string, unknown>>(
    `SELECT mr.*, m.family_name as mentor_name
     FROM mentor_requests mr
     JOIN mentor_profiles mp ON mr.mentor_id = mp.id
     JOIN coop_members m ON mp.member_id = m.id
     WHERE mr.requester_id = ?
     ORDER BY mr.created_at DESC`,
    requesterId
  )
  return rows.map(row => ({
    ...rowToMentorRequest(row),
    mentorName: row.mentor_name as string
  }))
}

export async function createMentorRequest(data: CreateMentorRequest): Promise<MentorRequest> {
  const db = await getDatabase()
  const id = uuidv4()

  await db.run(
    `INSERT INTO mentor_requests (id, mentor_id, requester_id, message, status)
     VALUES (?, ?, ?, ?, 'pending')`,
    id,
    data.mentorId,
    data.requesterId,
    data.message
  )

  const rows = await db.all<Record<string, unknown>>(
    'SELECT * FROM mentor_requests WHERE id = ?',
    id
  )
  return rowToMentorRequest(rows[0])
}

export async function respondToMentorRequest(
  id: string,
  status: MentorRequestStatus,
  responseMessage?: string
): Promise<MentorRequest> {
  const db = await getDatabase()

  await db.run(
    `UPDATE mentor_requests
     SET status = ?, response_message = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    status,
    responseMessage,
    id
  )

  // Update mentor's current mentee count if accepted
  if (status === 'accepted') {
    const request = await db.all<Record<string, unknown>>(
      'SELECT mentor_id FROM mentor_requests WHERE id = ?',
      id
    )
    if (request.length > 0) {
      await db.run(
        `UPDATE mentor_profiles
         SET current_mentee_count = current_mentee_count + 1, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        request[0].mentor_id
      )
    }
  }

  const rows = await db.all<Record<string, unknown>>(
    'SELECT * FROM mentor_requests WHERE id = ?',
    id
  )
  return rowToMentorRequest(rows[0])
}
