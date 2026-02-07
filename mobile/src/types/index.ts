// Mobile app types - mirrors desktop src/shared/types.ts

// Universal status for all trackable entities (milestones, field trips, reading, assessments)
export type UniversalStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "cancelled";

// Activity types supported by the system (consolidated from 9 to 6)
export type ActivityType =
  | "worksheet"
  | "video"
  | "reading"
  | "writing" // MERGED: was writing_print + writing_cursive
  | "hands_on"
  | "interactive"; // MERGED: was game + assessment + field_trip

// Event category for field trips (replaces EventActivityType)
export type EventCategory = "educational" | "social" | "coop";

export type GradeLevel =
  | "pre-k"
  | "k"
  | "1st"
  | "2nd"
  | "3rd"
  | "4th"
  | "5th"
  | "6th"
  | "7th"
  | "8th"
  | "9th"
  | "10th"
  | "11th"
  | "12th";

export interface Student {
  id: string;
  name: string;
  dateOfBirth: string;
  gradeLevel: GradeLevel;
  color: string;
  calendarFeedUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  description: string;
  gradeLevels: GradeLevel[];
  createdAt: string;
}

export interface Session {
  id: string;
  studentId: string;
  subjectId: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  sessionId: string | null;
  studentId: string;
  subjectId: string;
  activityType: ActivityType;
  activitySubType?: string; // Optional sub-type: 'print'|'cursive' for writing, 'game'|'test'|'event' for interactive
  title: string;
  description: string;
  dateCompleted: string;
  durationMinutes: number | null;
  grade: number | null;
  maxGrade: number | null;
  notes: string;
  bookTitle?: string;
  pagesRead?: number;
  totalPages?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  studentId: string;
  subjectId: string;
  templateId: string | null;
  title: string;
  description: string;
  category: string;
  targetDate: string | null;
  completedDate: string | null;
  status: UniversalStatus;
  evidenceNotes: string;
  starValue: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudentReward {
  id: string;
  studentId: string;
  milestoneId: string | null;
  starsAwarded: number;
  awardedDate: string;
  weekStart: string | null;
  syncedToSkylight: boolean;
  createdAt: string;
}

export interface FamilyGoal {
  id: string;
  title: string;
  starTarget: number;
  rewardDescription: string | null;
  startDate: string | null;
  endDate: string | null;
  achievedAt: string | null;
  createdAt: string;
}

// Book/Library types
// Reading status (subset of UniversalStatus - 'reading' mapped to 'in_progress', 'finished' to 'completed')
export type ReadingStatus = "not_started" | "in_progress" | "completed";

export interface Book {
  id: string;
  title: string;
  author?: string;
  isbn?: string;
  totalPages?: number;
  readingLevel?: string;
  genre?: string;
  coverImagePath?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentBook {
  id: string;
  studentId: string;
  bookId: string;
  status: ReadingStatus;
  currentPage: number;
  startedDate?: string;
  finishedDate?: string;
  rating?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookWithProgress extends Book {
  studentProgress?: StudentBook;
}

// Field Trips / Events
// Note: FieldTrips now use UniversalStatus ('planned' mapped to 'not_started' during migration)
// Note: EventActivityType eliminated - replaced with eventCategory field on FieldTrip interface

export interface FieldTrip {
  id: string;
  title: string;
  eventCategory: EventCategory;
  location: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  status: UniversalStatus;
  studentIds: string[];
  subjectIds: string[];
  cost?: number;
  websiteUrl?: string;
  notes?: string;
  learningOutcomes?: string;
  createdAt: string;
  updatedAt: string;
}

// Activity Tasks (todos for field trips/activities)
export type TaskPhase = "before" | "during" | "after"; // Renamed for clarity (was pre | day_of | post)

export interface ActivityTask {
  id: string;
  activityId: string;
  title: string;
  description?: string;
  phase: TaskPhase;
  assignedTo?: string;
  dueDate?: string;
  completedAt?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// Report types
export interface ActivitySummary {
  subjectId: string;
  subjectName: string;
  totalActivities: number;
  totalMinutes: number;
  averageGrade: number | null;
  byType: Record<ActivityType, number>;
}

export interface DailySummary {
  date: string;
  sessionsCount: number;
  activitiesCount: number;
  totalMinutes: number;
}

// Form types (for creating/updating entities)
export type CreateStudent = Omit<Student, "id" | "createdAt" | "updatedAt">;
export type UpdateStudent = Partial<CreateStudent>;

export type CreateSession = Omit<Session, "id" | "createdAt" | "updatedAt">;
export type UpdateSession = Partial<CreateSession>;

export type CreateActivity = Omit<Activity, "id" | "createdAt" | "updatedAt">;
export type UpdateActivity = Partial<CreateActivity>;

export type CreateMilestone = Omit<Milestone, "id" | "createdAt" | "updatedAt">;
export type UpdateMilestone = Partial<
  Omit<CreateMilestone, "studentId" | "templateId">
>;

export type CreateFieldTrip = Omit<FieldTrip, "id" | "createdAt" | "updatedAt">;
export type UpdateFieldTrip = Partial<CreateFieldTrip>;

export type CreateBook = Omit<Book, "id" | "createdAt" | "updatedAt">;
export type UpdateBook = Partial<CreateBook>;

export type CreateFamilyGoal = Omit<
  FamilyGoal,
  "id" | "createdAt" | "achievedAt"
>;
export type UpdateFamilyGoal = Partial<Omit<CreateFamilyGoal, never>>;
