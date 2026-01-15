import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../connection'
import type {
  ExternalEventSource,
  ExternalEvent,
  CreateExternalEventSource,
  UpdateExternalEventSource,
  CreateExternalEvent,
  UpdateExternalEvent,
  ExternalSourceType
} from '../../shared/types'

/**
 * Map a database row to an ExternalEventSource object.
 *
 * @param row - A database row containing external event source columns (expected keys: `id`, `coop_group_id`, `source_type`, `source_name`, `source_url`, `sync_enabled`, `last_synced_at`, `created_at`, `updated_at`).
 * @returns An ExternalEventSource populated from `row`: `id`, `coopGroupId` (nullable), `sourceType`, `sourceName`, `sourceUrl` (nullable), `syncEnabled`, `lastSyncedAt` (nullable), `createdAt`, and `updatedAt`.
 */
function rowToExternalEventSource(row: Record<string, unknown>): ExternalEventSource {
  return {
    id: row.id as string,
    coopGroupId: row.coop_group_id as string | null,
    sourceType: row.source_type as ExternalSourceType,
    sourceName: row.source_name as string,
    sourceUrl: row.source_url as string | null,
    syncEnabled: Boolean(row.sync_enabled),
    lastSyncedAt: row.last_synced_at as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  }
}

/**
 * Map a database row to an ExternalEvent domain object.
 *
 * @param row - A database result row containing external event columns (snake_case keys).
 * @returns An ExternalEvent with fields converted to camelCase and nullable values cast appropriately.
 */
function rowToExternalEvent(row: Record<string, unknown>): ExternalEvent {
  return {
    id: row.id as string,
    sourceId: row.source_id as string,
    externalEventId: row.external_event_id as string | null,
    title: row.title as string,
    description: row.description as string | null,
    location: row.location as string | null,
    eventDate: row.event_date as string,
    startTime: row.start_time as string | null,
    endTime: row.end_time as string | null,
    eventUrl: row.event_url as string | null,
    importedToFieldTripId: row.imported_to_field_trip_id as string | null,
    lastSyncedAt: row.last_synced_at as string | null,
    createdAt: row.created_at as string
  }
}

/**
 * Fetches external event sources, optionally filtered by coop group.
 *
 * @param coopGroupId - If provided, limits results to sources belonging to the given coop group
 * @returns An array of ExternalEventSource objects ordered by `source_name`
 */

export async function getExternalEventSources(coopGroupId?: string): Promise<ExternalEventSource[]> {
  const db = await getDatabase()
  let query = 'SELECT * FROM external_event_sources'
  const params: unknown[] = []

  if (coopGroupId) {
    query += ' WHERE coop_group_id = ?'
    params.push(coopGroupId)
  }

  query += ' ORDER BY source_name'
  const rows = await db.all(query, ...params)
  return rows.map(rowToExternalEventSource)
}

/**
 * Fetches an external event source by its identifier.
 *
 * @param id - The external event source id to look up
 * @returns The matching `ExternalEventSource` if found, `null` otherwise
 */
export async function getExternalEventSource(id: string): Promise<ExternalEventSource | null> {
  const db = await getDatabase()
  const rows = await db.all('SELECT * FROM external_event_sources WHERE id = ?', id)
  return rows.length > 0 ? rowToExternalEventSource(rows[0]) : null
}

/**
 * Create a new external event source and return the created object.
 *
 * @param data - Properties for the new external event source. `coopGroupId` and `sourceUrl` will be stored as null if omitted; `syncEnabled` controls whether syncing is enabled.
 * @returns The created `ExternalEventSource`.
 */
export async function createExternalEventSource(data: CreateExternalEventSource): Promise<ExternalEventSource> {
  const db = await getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  await db.run(
    `INSERT INTO external_event_sources (
      id, coop_group_id, source_type, source_name, source_url, sync_enabled, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.coopGroupId || null,
    data.sourceType,
    data.sourceName,
    data.sourceUrl || null,
    data.syncEnabled ? 1 : 0,
    now,
    now
  )

  return (await getExternalEventSource(id))!
}

/**
 * Updates an existing external event source with the provided fields and returns the updated record.
 *
 * @param id - The ID of the external event source to update
 * @param data - Fields to apply to the external event source
 * @returns The updated ExternalEventSource
 * @throws Error if no external event source with the given `id` exists
 */
export async function updateExternalEventSource(id: string, data: UpdateExternalEventSource): Promise<ExternalEventSource> {
  const db = await getDatabase()
  const existing = await getExternalEventSource(id)
  if (!existing) throw new Error(`External event source ${id} not found`)

  const updated = { ...existing, ...data, updatedAt: new Date().toISOString() }

  await db.run(
    `UPDATE external_event_sources SET
      coop_group_id = ?, source_name = ?, source_url = ?, sync_enabled = ?, updated_at = ?
     WHERE id = ?`,
    updated.coopGroupId || null,
    updated.sourceName,
    updated.sourceUrl || null,
    updated.syncEnabled ? 1 : 0,
    updated.updatedAt,
    id
  )

  return (await getExternalEventSource(id))!
}

/**
 * Delete the external event source with the specified id.
 *
 * @param id - The external event source's id to remove from the database
 */
export async function deleteExternalEventSource(id: string): Promise<void> {
  const db = await getDatabase()
  await db.run('DELETE FROM external_event_sources WHERE id = ?', id)
}

/**
 * Fetches external events from the database, optionally scoped to a specific source, ordered by event date and start time.
 *
 * @param sourceId - Optional ID of an external event source to filter returned events
 * @returns An array of ExternalEvent objects; if `sourceId` is provided, only events for that source are included
 */

export async function getExternalEvents(sourceId?: string): Promise<ExternalEvent[]> {
  const db = await getDatabase()
  let query = 'SELECT * FROM external_events'
  const params: unknown[] = []

  if (sourceId) {
    query += ' WHERE source_id = ?'
    params.push(sourceId)
  }

  query += ' ORDER BY event_date, start_time'
  const rows = await db.all(query, ...params)
  return rows.map(rowToExternalEvent)
}

/**
 * Fetches an external event by its identifier.
 *
 * @returns The `ExternalEvent` with the given `id`, or `null` if no matching event is found.
 */
export async function getExternalEvent(id: string): Promise<ExternalEvent | null> {
  const db = await getDatabase()
  const rows = await db.all('SELECT * FROM external_events WHERE id = ?', id)
  return rows.length > 0 ? rowToExternalEvent(rows[0]) : null
}

/**
 * Create a new external event record and return the created ExternalEvent.
 *
 * @param data - Event properties. `externalEventId`, `description`, `location`, `startTime`, `endTime`, and `eventUrl` may be omitted.
 * @returns The newly created `ExternalEvent`.
 */
export async function createExternalEvent(data: CreateExternalEvent): Promise<ExternalEvent> {
  const db = await getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  await db.run(
    `INSERT INTO external_events (
      id, source_id, external_event_id, title, description, location,
      event_date, start_time, end_time, event_url, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.sourceId,
    data.externalEventId || null,
    data.title,
    data.description || null,
    data.location || null,
    data.eventDate,
    data.startTime || null,
    data.endTime || null,
    data.eventUrl || null,
    now
  )

  return (await getExternalEvent(id))!
}

/**
 * Update an existing external event with the provided fields.
 *
 * Merges the supplied update data into the stored event, persists the changes to the database, and returns the refreshed event record.
 *
 * @param id - The ID of the external event to update
 * @param data - Fields to update on the external event
 * @returns The updated `ExternalEvent`
 * @throws Error if no external event exists with the given `id`
 */
export async function updateExternalEvent(id: string, data: UpdateExternalEvent): Promise<ExternalEvent> {
  const db = await getDatabase()
  const existing = await getExternalEvent(id)
  if (!existing) throw new Error(`External event ${id} not found`)

  const updated = { ...existing, ...data }

  await db.run(
    `UPDATE external_events SET
      title = ?, description = ?, location = ?, event_date = ?,
      start_time = ?, end_time = ?, event_url = ?, imported_to_field_trip_id = ?
     WHERE id = ?`,
    updated.title,
    updated.description || null,
    updated.location || null,
    updated.eventDate,
    updated.startTime || null,
    updated.endTime || null,
    updated.eventUrl || null,
    updated.importedToFieldTripId || null,
    id
  )

  return (await getExternalEvent(id))!
}

/**
 * Delete the external event with the given id from the database.
 *
 * @param id - The id of the external event to delete
 */
export async function deleteExternalEvent(id: string): Promise<void> {
  const db = await getDatabase()
  await db.run('DELETE FROM external_events WHERE id = ?', id)
}

/**
 * Create a field trip from an external event and link the external event to it.
 *
 * Inserts a new field_trips record populated from the external event's data, sets the provided students on the trip, and updates the external event's `importedToFieldTripId` to the new field trip ID.
 *
 * @param externalEventId - ID of the external event to import
 * @param studentIds - Array of student IDs to include on the created field trip
 * @returns The ID of the newly created field trip
 * @throws Error if the external event with `externalEventId` cannot be found
 */
export async function importExternalEventToFieldTrip(
  externalEventId: string,
  studentIds: string[]
): Promise<string> {
  const db = await getDatabase()
  const event = await getExternalEvent(externalEventId)
  if (!event) throw new Error(`External event ${externalEventId} not found`)

  // Create a new field trip from the external event
  const fieldTripId = uuidv4()
  const now = new Date().toISOString()

  await db.run(
    `INSERT INTO field_trips (
      id, title, location, description, date, status, student_ids, subject_ids,
      website_url, activity_type, start_time, end_time, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    fieldTripId,
    event.title,
    event.location || 'TBD',
    event.description || '',
    event.eventDate,
    'planned',
    JSON.stringify(studentIds),
    JSON.stringify([]),
    event.eventUrl,
    'field_trip',
    event.startTime,
    event.endTime,
    now,
    now
  )

  // Update the external event to link to the field trip
  await updateExternalEvent(externalEventId, { importedToFieldTripId: fieldTripId })

  return fieldTripId
}