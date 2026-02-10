/**
 * Sync event types - matches desktop app event sourcing model
 */

// Base event structure
export interface SyncEvent {
  id: string;
  type: string;
  timestamp: HLCTimestamp;
  deviceId: string;
  version: number;
  data: Record<string, unknown>;
}

// Hybrid Logical Clock timestamp
export interface HLCTimestamp {
  time: number;
  counter: number;
  node: string;
}

// Event type definitions
export type EventType =
  // Student events
  | "student.created"
  | "student.updated"
  | "student.deleted"
  // Subject events
  | "subject.created"
  | "subject.updated"
  | "subject.deleted"
  // Activity events
  | "activity.logged"
  | "activity.updated"
  | "activity.deleted"
  // Milestone events
  | "milestone.created"
  | "milestone.updated"
  | "milestone.completed"
  | "milestone.deleted"
  // Session events
  | "session.created"
  | "session.updated"
  | "session.deleted"
  // Book events
  | "book.created"
  | "book.updated"
  | "book.deleted"
  // Field trip events
  | "fieldTrip.created"
  | "fieldTrip.updated"
  | "fieldTrip.deleted"
  // Weekly plan events
  | "weeklyPlan.created"
  | "weeklyPlan.updated"
  | "weeklyPlan.deleted"
  // Settings events
  | "settings.updated"
  // Family management events
  | "member.kicked";

// Student event data
export interface StudentCreatedData {
  id: string;
  name: string;
  dateOfBirth: string;
  gradeLevel: string;
  color: string;
}

export interface StudentUpdatedData {
  id: string;
  name?: string;
  dateOfBirth?: string;
  gradeLevel?: string;
  color?: string;
}

export interface StudentDeletedData {
  id: string;
}

// Activity event data
export interface ActivityLoggedData {
  id: string;
  studentId: string;
  subjectId: string;
  activityType: string;
  title: string;
  description?: string;
  duration?: number;
  completedAt: string;
  starsEarned?: number;
}

export interface ActivityUpdatedData {
  id: string;
  title?: string;
  description?: string;
  duration?: number;
  starsEarned?: number;
}

export interface ActivityDeletedData {
  id: string;
}

// Milestone event data
export interface MilestoneCreatedData {
  id: string;
  studentId: string;
  subjectId?: string;
  title: string;
  description?: string;
  targetDate?: string;
  status: string;
  starsReward?: number;
}

export interface MilestoneUpdatedData {
  id: string;
  title?: string;
  description?: string;
  targetDate?: string;
  status?: string;
  starsReward?: number;
}

export interface MilestoneCompletedData {
  id: string;
  completedAt: string;
}

export interface MilestoneDeletedData {
  id: string;
}

// Field trip event data
export interface FieldTripCreatedData {
  id: string;
  title: string;
  location?: string;
  date: string;
  description?: string;
  eventType: string;
  studentIds: string[];
}

export interface FieldTripUpdatedData {
  id: string;
  title?: string;
  location?: string;
  date?: string;
  description?: string;
  eventType?: string;
  studentIds?: string[];
}

export interface FieldTripDeletedData {
  id: string;
}

// Book event data
export interface BookCreatedData {
  id: string;
  studentId: string;
  title: string;
  author?: string;
  isbn?: string;
  status: string;
  startDate?: string;
  finishDate?: string;
}

export interface BookUpdatedData {
  id: string;
  title?: string;
  author?: string;
  status?: string;
  startDate?: string;
  finishDate?: string;
  currentPage?: number;
  totalPages?: number;
}

export interface BookDeletedData {
  id: string;
}

// Subject event data
export interface SubjectCreatedData {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface SubjectUpdatedData {
  id: string;
  name?: string;
  color?: string;
  icon?: string;
}

export interface SubjectDeletedData {
  id: string;
}

// Member kicked event data
export interface MemberKickedData {
  deviceId: string;
  deviceName: string;
  reason?: string;
}

// Helper to create events
export function createSyncEvent<T extends Record<string, unknown>>(
  type: EventType,
  data: T,
  deviceId: string,
  timestamp: HLCTimestamp,
): SyncEvent {
  return {
    id: generateUUID(),
    type,
    timestamp,
    deviceId,
    version: 1,
    data,
  };
}

// UUID generator
export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
