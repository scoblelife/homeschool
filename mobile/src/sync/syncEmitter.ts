/**
 * Sync Emitter - helper functions for emitting sync events from repositories
 */

import { SyncManager } from './syncManager'
import {
  StudentCreatedData,
  StudentUpdatedData,
  ActivityLoggedData,
  ActivityUpdatedData,
  MilestoneCreatedData,
  MilestoneUpdatedData,
  FieldTripCreatedData,
  FieldTripUpdatedData,
  SubjectCreatedData,
  SubjectUpdatedData,
  BookCreatedData,
  BookUpdatedData,
} from './events'

const syncManager = SyncManager.getInstance()

// Helper to cast data for emitEvent
function toRecord<T extends object>(data: T): Record<string, unknown> {
  return data as unknown as Record<string, unknown>
}

// Student events
export async function emitStudentCreated(data: StudentCreatedData): Promise<void> {
  await syncManager.emitEvent('student.created', toRecord(data))
}

export async function emitStudentUpdated(data: StudentUpdatedData): Promise<void> {
  await syncManager.emitEvent('student.updated', toRecord(data))
}

export async function emitStudentDeleted(id: string): Promise<void> {
  await syncManager.emitEvent('student.deleted', { id })
}

// Activity events
export async function emitActivityLogged(data: ActivityLoggedData): Promise<void> {
  await syncManager.emitEvent('activity.logged', toRecord(data))
}

export async function emitActivityUpdated(data: ActivityUpdatedData): Promise<void> {
  await syncManager.emitEvent('activity.updated', toRecord(data))
}

export async function emitActivityDeleted(id: string): Promise<void> {
  await syncManager.emitEvent('activity.deleted', { id })
}

// Milestone events
export async function emitMilestoneCreated(data: MilestoneCreatedData): Promise<void> {
  await syncManager.emitEvent('milestone.created', toRecord(data))
}

export async function emitMilestoneUpdated(data: MilestoneUpdatedData): Promise<void> {
  await syncManager.emitEvent('milestone.updated', toRecord(data))
}

export async function emitMilestoneCompleted(id: string, completedAt: string): Promise<void> {
  await syncManager.emitEvent('milestone.completed', { id, completedAt })
}

export async function emitMilestoneDeleted(id: string): Promise<void> {
  await syncManager.emitEvent('milestone.deleted', { id })
}

// Field trip events
export async function emitFieldTripCreated(data: FieldTripCreatedData): Promise<void> {
  await syncManager.emitEvent('fieldTrip.created', toRecord(data))
}

export async function emitFieldTripUpdated(data: FieldTripUpdatedData): Promise<void> {
  await syncManager.emitEvent('fieldTrip.updated', toRecord(data))
}

export async function emitFieldTripDeleted(id: string): Promise<void> {
  await syncManager.emitEvent('fieldTrip.deleted', { id })
}

// Subject events
export async function emitSubjectCreated(data: SubjectCreatedData): Promise<void> {
  await syncManager.emitEvent('subject.created', toRecord(data))
}

export async function emitSubjectUpdated(data: SubjectUpdatedData): Promise<void> {
  await syncManager.emitEvent('subject.updated', toRecord(data))
}

export async function emitSubjectDeleted(id: string): Promise<void> {
  await syncManager.emitEvent('subject.deleted', { id })
}

// Book events
export async function emitBookCreated(data: BookCreatedData): Promise<void> {
  await syncManager.emitEvent('book.created', toRecord(data))
}

export async function emitBookUpdated(data: BookUpdatedData): Promise<void> {
  await syncManager.emitEvent('book.updated', toRecord(data))
}

export async function emitBookDeleted(id: string): Promise<void> {
  await syncManager.emitEvent('book.deleted', { id })
}
