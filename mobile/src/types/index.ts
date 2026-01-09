// Mobile app types - mirrors desktop src/shared/types.ts

// Activity types supported by the system
export type ActivityType =
  | 'worksheet'
  | 'video'
  | 'reading'
  | 'writing_print'
  | 'writing_cursive'
  | 'hands_on'
  | 'game'
  | 'assessment'
  | 'field_trip'

export type GradeLevel = 'pre-k' | 'k' | '1st' | '2nd' | '3rd' | '4th' | '5th' | '6th' | '7th' | '8th' | '9th' | '10th' | '11th' | '12th'

export interface Student {
  id: string
  name: string
  dateOfBirth: string
  gradeLevel: GradeLevel
  color: string
  calendarFeedUrl?: string
  createdAt: string
  updatedAt: string
}

export interface Subject {
  id: string
  name: string
  description: string
  gradeLevels: GradeLevel[]
  createdAt: string
}

export interface Session {
  id: string
  studentId: string
  subjectId: string
  date: string
  startTime: string | null
  endTime: string | null
  notes: string
  createdAt: string
  updatedAt: string
}

export interface Activity {
  id: string
  sessionId: string | null
  studentId: string
  subjectId: string
  activityType: ActivityType
  title: string
  description: string
  dateCompleted: string
  durationMinutes: number | null
  grade: number | null
  maxGrade: number | null
  notes: string
  bookTitle?: string
  pagesRead?: number
  totalPages?: number
  createdAt: string
  updatedAt: string
}

export interface Milestone {
  id: string
  studentId: string
  subjectId: string
  templateId: string | null
  title: string
  description: string
  category: string
  targetDate: string | null
  completedDate: string | null
  status: 'not_started' | 'in_progress' | 'completed'
  evidenceNotes: string
  starValue: number
  createdAt: string
  updatedAt: string
}

export interface StudentReward {
  id: string
  studentId: string
  milestoneId: string | null
  starsAwarded: number
  awardedDate: string
  weekStart: string | null
  syncedToSkylight: boolean
  createdAt: string
}

export interface FamilyGoal {
  id: string
  title: string
  starTarget: number
  rewardDescription: string | null
  startDate: string | null
  endDate: string | null
  achievedAt: string | null
  createdAt: string
}

// Book/Library types
export type ReadingStatus = 'not_started' | 'reading' | 'finished'

export interface Book {
  id: string
  title: string
  author?: string
  isbn?: string
  totalPages?: number
  readingLevel?: string
  genre?: string
  coverImagePath?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface StudentBook {
  id: string
  studentId: string
  bookId: string
  status: ReadingStatus
  currentPage: number
  startedDate?: string
  finishedDate?: string
  rating?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface BookWithProgress extends Book {
  studentProgress?: StudentBook
}

// Field Trips / Events
export type FieldTripStatus = 'planned' | 'completed' | 'cancelled'

export type EventActivityType =
  | 'field_trip'
  | 'park_day'
  | 'game_night'
  | 'playdate'
  | 'coop_class'
  | 'custom'

export interface FieldTrip {
  id: string
  title: string
  activityType: EventActivityType
  location: string
  description?: string
  date: string
  startTime?: string
  endTime?: string
  status: FieldTripStatus
  studentIds: string[]
  subjectIds: string[]
  cost?: number
  websiteUrl?: string
  notes?: string
  learningOutcomes?: string
  createdAt: string
  updatedAt: string
}

export type TaskPhase = 'pre' | 'day_of' | 'post'

export interface ActivityTask {
  id: string
  activityId: string
  title: string
  description?: string
  phase: TaskPhase
  assignedTo?: string
  dueDate?: string
  completedAt?: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

// Report types
export interface ActivitySummary {
  subjectId: string
  subjectName: string
  totalActivities: number
  totalMinutes: number
  averageGrade: number | null
  byType: Record<ActivityType, number>
}

export interface DailySummary {
  date: string
  sessionsCount: number
  activitiesCount: number
  totalMinutes: number
}

// Form types (for creating/updating entities)
export type CreateStudent = Omit<Student, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateStudent = Partial<CreateStudent>

export type CreateSession = Omit<Session, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateSession = Partial<CreateSession>

export type CreateActivity = Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateActivity = Partial<CreateActivity>

export type CreateMilestone = Omit<Milestone, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateMilestone = Partial<Omit<CreateMilestone, 'studentId' | 'templateId'>>

export type CreateFieldTrip = Omit<FieldTrip, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateFieldTrip = Partial<CreateFieldTrip>

export type CreateBook = Omit<Book, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateBook = Partial<CreateBook>

export type CreateFamilyGoal = Omit<FamilyGoal, 'id' | 'createdAt' | 'achievedAt'>
export type UpdateFamilyGoal = Partial<Omit<CreateFamilyGoal, never>>
