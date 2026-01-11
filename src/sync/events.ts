/**
 * Event type definitions for P2P sync with event sourcing
 * All database mutations are captured as immutable events
 */

import type { HLCTimestamp } from './hlc'

// Base event structure - all events extend this
export interface BaseEvent {
  id: string // UUID
  type: string // Event type discriminator
  timestamp: HLCTimestamp // Hybrid logical clock for causal ordering
  deviceId: string // Originating device
  version: 1 // Schema version for future migrations
}

// ============ Student Events ============

export interface StudentCreatedEvent extends BaseEvent {
  type: 'student.created'
  data: {
    id: string
    name: string
    dateOfBirth: string
    gradeLevel: string
    color: string
  }
}

export interface StudentUpdatedEvent extends BaseEvent {
  type: 'student.updated'
  data: {
    id: string
    changes: {
      name?: string
      dateOfBirth?: string
      gradeLevel?: string
      color?: string
      calendarFeedUrl?: string
    }
  }
}

export interface StudentDeletedEvent extends BaseEvent {
  type: 'student.deleted'
  data: { id: string }
}

// ============ Subject Events ============

export interface SubjectCreatedEvent extends BaseEvent {
  type: 'subject.created'
  data: {
    id: string
    name: string
    description?: string
    gradeLevels: string[]
  }
}

export interface SubjectUpdatedEvent extends BaseEvent {
  type: 'subject.updated'
  data: {
    id: string
    changes: {
      name?: string
      description?: string
      gradeLevels?: string[]
    }
  }
}

export interface SubjectDeletedEvent extends BaseEvent {
  type: 'subject.deleted'
  data: { id: string }
}

// ============ Activity Events ============

export interface ActivityLoggedEvent extends BaseEvent {
  type: 'activity.logged'
  data: {
    id: string
    sessionId?: string
    studentId: string
    subjectId: string
    activityType: string
    title: string
    description?: string
    dateCompleted: string
    durationMinutes?: number
    grade?: number
    maxGrade?: number
    notes?: string
    bookTitle?: string
    pagesRead?: number
    totalPages?: number
  }
}

export interface ActivityUpdatedEvent extends BaseEvent {
  type: 'activity.updated'
  data: {
    id: string
    changes: {
      title?: string
      description?: string
      dateCompleted?: string
      durationMinutes?: number
      grade?: number
      maxGrade?: number
      notes?: string
      bookTitle?: string
      pagesRead?: number
      totalPages?: number
    }
  }
}

export interface ActivityDeletedEvent extends BaseEvent {
  type: 'activity.deleted'
  data: { id: string }
}

// ============ Milestone Events ============

export interface MilestoneCreatedEvent extends BaseEvent {
  type: 'milestone.created'
  data: {
    id: string
    studentId: string
    subjectId: string
    templateId?: string
    title: string
    description?: string
    category?: string
    targetDate?: string
    status: string
  }
}

export interface MilestoneUpdatedEvent extends BaseEvent {
  type: 'milestone.updated'
  data: {
    id: string
    changes: {
      title?: string
      description?: string
      category?: string
      targetDate?: string
      status?: string
      evidenceNotes?: string
      completedDate?: string
    }
  }
}

export interface MilestoneCompletedEvent extends BaseEvent {
  type: 'milestone.completed'
  data: {
    id: string
    completedDate: string
    evidenceNotes?: string
  }
}

export interface MilestoneDeletedEvent extends BaseEvent {
  type: 'milestone.deleted'
  data: { id: string }
}

// ============ Book Events ============

export interface BookCreatedEvent extends BaseEvent {
  type: 'book.created'
  data: {
    id: string
    title: string
    author?: string
    isbn?: string
    totalPages?: number
    readingLevel?: string
    genre?: string
    coverImagePath?: string
    notes?: string
  }
}

export interface BookUpdatedEvent extends BaseEvent {
  type: 'book.updated'
  data: {
    id: string
    changes: {
      title?: string
      author?: string
      isbn?: string
      totalPages?: number
      readingLevel?: string
      genre?: string
      coverImagePath?: string
      notes?: string
    }
  }
}

export interface BookDeletedEvent extends BaseEvent {
  type: 'book.deleted'
  data: { id: string }
}

// ============ Student Book (Reading Progress) Events ============

export interface StudentBookStartedEvent extends BaseEvent {
  type: 'studentBook.started'
  data: {
    id: string
    studentId: string
    bookId: string
    startedDate: string
  }
}

export interface StudentBookProgressEvent extends BaseEvent {
  type: 'studentBook.progress'
  data: {
    id: string
    studentId: string
    bookId: string
    currentPage: number
  }
}

export interface StudentBookFinishedEvent extends BaseEvent {
  type: 'studentBook.finished'
  data: {
    id: string
    studentId: string
    bookId: string
    finishedDate: string
    rating?: number
    notes?: string
  }
}

// ============ Field Trip / Activity Events ============

export interface FieldTripCreatedEvent extends BaseEvent {
  type: 'fieldTrip.created'
  data: {
    id: string
    title: string
    location: string
    description?: string
    date: string
    status: string
    studentIds: string[]
    subjectIds: string[]
    cost?: number
    websiteUrl?: string
    notes?: string
    learningOutcomes?: string
    activityType: string
    startTime?: string
    endTime?: string
  }
}

export interface FieldTripUpdatedEvent extends BaseEvent {
  type: 'fieldTrip.updated'
  data: {
    id: string
    changes: {
      title?: string
      location?: string
      description?: string
      date?: string
      status?: string
      studentIds?: string[]
      subjectIds?: string[]
      cost?: number
      websiteUrl?: string
      notes?: string
      learningOutcomes?: string
      activityType?: string
      startTime?: string
      endTime?: string
    }
  }
}

export interface FieldTripDeletedEvent extends BaseEvent {
  type: 'fieldTrip.deleted'
  data: { id: string }
}

// ============ Weekly Plan Events ============

export interface WeeklyPlanCreatedEvent extends BaseEvent {
  type: 'weeklyPlan.created'
  data: {
    id: string
    studentId: string
    weekStart: string
    milestoneIds: string[]
  }
}

export interface WeeklyPlanUpdatedEvent extends BaseEvent {
  type: 'weeklyPlan.updated'
  data: {
    id: string
    changes: {
      milestoneIds?: string[]
    }
  }
}

// ============ Session Events ============

export interface SessionCreatedEvent extends BaseEvent {
  type: 'session.created'
  data: {
    id: string
    studentId: string
    subjectId: string
    date: string
    startTime?: string
    endTime?: string
    notes?: string
  }
}

export interface SessionUpdatedEvent extends BaseEvent {
  type: 'session.updated'
  data: {
    id: string
    changes: {
      date?: string
      startTime?: string
      endTime?: string
      notes?: string
    }
  }
}

export interface SessionDeletedEvent extends BaseEvent {
  type: 'session.deleted'
  data: { id: string }
}

// ============ Attendance Events ============

export interface AttendanceCreatedEvent extends BaseEvent {
  type: 'attendance.created'
  data: {
    id: string
    studentId: string
    date: string
    status: string
    notes?: string
  }
}

export interface AttendanceUpdatedEvent extends BaseEvent {
  type: 'attendance.updated'
  data: {
    id: string
    studentId: string
    date: string
    status: string
    notes?: string
  }
}

export interface AttendanceDeletedEvent extends BaseEvent {
  type: 'attendance.deleted'
  data: {
    id: string
    studentId: string
    date: string
  }
}

// ============ Curriculum Events ============

export interface CustomStandardCreatedEvent extends BaseEvent {
  type: 'customStandard.created'
  data: {
    id: string
    code: string
    title: string
    description?: string
    gradeLevel: string
    subjectId: string
    domain: string
  }
}

export interface CustomStandardUpdatedEvent extends BaseEvent {
  type: 'customStandard.updated'
  data: {
    id: string
    code?: string
    title?: string
    description?: string
    domain?: string
  }
}

export interface CustomStandardDeletedEvent extends BaseEvent {
  type: 'customStandard.deleted'
  data: { id: string }
}

export interface ActivityStandardCreatedEvent extends BaseEvent {
  type: 'activityStandard.created'
  data: {
    id: string
    activityId: string
    standardId: string
  }
}

export interface ActivityStandardDeletedEvent extends BaseEvent {
  type: 'activityStandard.deleted'
  data: {
    activityId: string
    standardId: string
  }
}

// ============ Settings Events ============

export interface SettingChangedEvent extends BaseEvent {
  type: 'setting.changed'
  data: {
    key: string
    value: string
  }
}

// ============ Member Management Events ============

export interface MemberAddedEvent extends BaseEvent {
  type: 'member.added'
  data: {
    deviceId: string
    deviceName: string
    pubKey: string
    addedBy: string // deviceId of who added them
    isManager: boolean
  }
}

export interface MemberKickedEvent extends BaseEvent {
  type: 'member.kicked'
  data: {
    kickedDeviceId: string
    kickedPubKey: string
    kickedDeviceName: string
    kickedBy: string // deviceId of who kicked them
    reason?: string
    selfDestruct?: boolean // Request that kicked device delete its data
  }
}

export interface ManagerDesignatedEvent extends BaseEvent {
  type: 'manager.designated'
  data: {
    successors: string[] // deviceIds in order of succession
  }
}

export interface ManagerTransferredEvent extends BaseEvent {
  type: 'manager.transferred'
  data: {
    newManagerId: string
    previousManagerId: string
  }
}

// ============ Union Type of All Events ============

export type SyncEvent =
  // Student
  | StudentCreatedEvent
  | StudentUpdatedEvent
  | StudentDeletedEvent
  // Subject
  | SubjectCreatedEvent
  | SubjectUpdatedEvent
  | SubjectDeletedEvent
  // Activity
  | ActivityLoggedEvent
  | ActivityUpdatedEvent
  | ActivityDeletedEvent
  // Milestone
  | MilestoneCreatedEvent
  | MilestoneUpdatedEvent
  | MilestoneCompletedEvent
  | MilestoneDeletedEvent
  // Book
  | BookCreatedEvent
  | BookUpdatedEvent
  | BookDeletedEvent
  // Student Book
  | StudentBookStartedEvent
  | StudentBookProgressEvent
  | StudentBookFinishedEvent
  // Field Trip
  | FieldTripCreatedEvent
  | FieldTripUpdatedEvent
  | FieldTripDeletedEvent
  // Weekly Plan
  | WeeklyPlanCreatedEvent
  | WeeklyPlanUpdatedEvent
  // Session
  | SessionCreatedEvent
  | SessionUpdatedEvent
  | SessionDeletedEvent
  // Attendance
  | AttendanceCreatedEvent
  | AttendanceUpdatedEvent
  | AttendanceDeletedEvent
  // Curriculum
  | CustomStandardCreatedEvent
  | CustomStandardUpdatedEvent
  | CustomStandardDeletedEvent
  | ActivityStandardCreatedEvent
  | ActivityStandardDeletedEvent
  // Settings
  | SettingChangedEvent
  // Member Management
  | MemberAddedEvent
  | MemberKickedEvent
  | ManagerDesignatedEvent
  | ManagerTransferredEvent

// ============ Event Creation Helpers ============

export function createEventId(): string {
  return crypto.randomUUID()
}

export function isValidEvent(event: unknown): event is SyncEvent {
  if (!event || typeof event !== 'object') return false
  const e = event as Record<string, unknown>
  return (
    typeof e.id === 'string' &&
    typeof e.type === 'string' &&
    typeof e.deviceId === 'string' &&
    e.timestamp !== undefined &&
    e.version === 1
  )
}
