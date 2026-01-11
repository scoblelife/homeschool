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

// Calendar busy event from iCal feed
export interface CalendarBusyEvent {
  start: string
  end: string
  summary?: string
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
  // Type-specific fields
  bookTitle?: string
  pagesRead?: number
  totalPages?: number
  createdAt: string
  updatedAt: string
}

export interface MilestoneTemplate {
  id: string
  gradeLevel: GradeLevel
  subjectId: string
  title: string
  description: string
  category: string
  sortOrder: number
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

export type CreateMilestone = Omit<Milestone, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateMilestone = Partial<Omit<CreateMilestone, 'studentId' | 'templateId'>>

// Skylight Integration
export interface SubjectChoreMapping {
  id: string
  subjectId: string
  choreName: string
  defaultStars: number
  createdAt: string
}

export type CreateChoreMapping = Omit<SubjectChoreMapping, 'id' | 'createdAt'>
export type UpdateChoreMapping = Partial<Omit<CreateChoreMapping, 'subjectId'>>

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

export type CreateReward = Omit<StudentReward, 'id' | 'createdAt'>

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

export type CreateFamilyGoal = Omit<FamilyGoal, 'id' | 'createdAt' | 'achievedAt'>
export type UpdateFamilyGoal = Partial<Omit<CreateFamilyGoal, never>>

// Recurring Activities
export type RecurrencePattern = 'daily' | 'weekdays' | 'weekly' | 'custom'

export interface RecurringActivity {
  id: string
  studentId: string
  subjectId: string
  title: string
  activityType: ActivityType
  durationMinutes: number | null
  recurrencePattern: RecurrencePattern
  recurrenceDays: number[] | null  // 0=Sun, 1=Mon, ... 6=Sat for custom pattern
  startTime: string | null  // HH:mm format
  isActive: boolean
  lastLoggedDate: string | null
  createdAt: string
  updatedAt: string
}

export type CreateRecurringActivity = Omit<RecurringActivity, 'id' | 'createdAt' | 'updatedAt' | 'lastLoggedDate'>
export type UpdateRecurringActivity = Partial<Omit<CreateRecurringActivity, 'studentId'>>

// Activity Attachments
export interface ActivityAttachment {
  id: string
  activityId: string
  filePath: string
  thumbnailPath: string | null
  fileName: string
  fileType: string
  fileSize: number | null
  width: number | null
  height: number | null
  createdAt: string
}

export type CreateAttachment = Omit<ActivityAttachment, 'id' | 'createdAt' | 'thumbnailPath'>

// Book Scanner Types (QR code phone scanning)
export interface ScannedBook {
  isbn: string
  title: string
  author?: string
  totalPages?: number
  coverUrl?: string         // Open Library URL (fallback)
  coverPhoto?: string       // Base64 data URL from phone camera (priority)
  publishedDate?: string
}

export interface ScannerSession {
  channelId: string
  channelUrl: string
  qrCodeDataUrl: string
  isActive: boolean
}

export interface MilestoneResource {
  id: string
  milestoneId: string
  type: 'url' | 'file'
  title: string
  url?: string
  filePath?: string
  fileName?: string
  createdAt: string
}

export type CreateResource = Omit<MilestoneResource, 'id' | 'createdAt'>

export interface WeeklyPlan {
  id: string
  studentId: string
  weekStart: string
  milestoneIds: string[]
  createdAt: string
  updatedAt: string
}

// Library / Book tracking
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

// Book with student reading progress
export interface BookWithProgress extends Book {
  studentProgress?: StudentBook
}

export type CreateBook = Omit<Book, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateBook = Partial<CreateBook>
export type CreateStudentBook = Omit<StudentBook, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateStudentBook = Partial<Omit<CreateStudentBook, 'studentId' | 'bookId'>>

// Field Trips / Activities
export type FieldTripStatus = 'planned' | 'completed' | 'cancelled'

// Event activity types (distinct from learning ActivityType above)
export type EventActivityType =
  | 'field_trip'   // Educational outing
  | 'park_day'     // Casual social meetup
  | 'game_night'   // Board games, social
  | 'playdate'     // 1-on-1 or small group
  | 'coop_class'   // Recurring educational
  | 'custom'       // User-defined

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

export type CreateFieldTrip = Omit<FieldTrip, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateFieldTrip = Partial<CreateFieldTrip>

// Activity Tasks (todos for field trips/activities)
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

export type CreateActivityTask = Omit<ActivityTask, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateActivityTask = Partial<Omit<CreateActivityTask, 'activityId'>>

// Activity Contacts (venue contacts, organizers, etc.)
export type ContactRole = 'venue' | 'organizer' | 'emergency' | 'other'

export interface ActivityContact {
  id: string
  activityId: string
  name: string
  role?: ContactRole
  phone?: string
  email?: string
  notes?: string
  createdAt: string
}

export type CreateActivityContact = Omit<ActivityContact, 'id' | 'createdAt'>
export type UpdateActivityContact = Partial<Omit<CreateActivityContact, 'activityId'>>

// Activity RSVPs (for group events)
export type RSVPStatus = 'invited' | 'confirmed' | 'declined' | 'maybe'

export interface ActivityRSVP {
  id: string
  activityId: string
  familyName: string
  attendingCount: number
  status: RSVPStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

export type CreateActivityRSVP = Omit<ActivityRSVP, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateActivityRSVP = Partial<Omit<CreateActivityRSVP, 'activityId'>>

// Activity Expenses
export type ExpenseCategory = 'admission' | 'food' | 'supplies' | 'transportation' | 'other'

export interface ActivityExpense {
  id: string
  activityId: string
  description: string
  amount: number
  category?: ExpenseCategory
  paidBy?: string
  expenseDate?: string
  createdAt: string
}

export type CreateActivityExpense = Omit<ActivityExpense, 'id' | 'createdAt'>
export type UpdateActivityExpense = Partial<Omit<CreateActivityExpense, 'activityId'>>

// Activity Payments (for group events - tracking who has paid)
export type PaymentStatus = 'pending' | 'paid' | 'partial'

export interface ActivityPayment {
  id: string
  activityId: string
  familyName: string
  amount: number
  status: PaymentStatus
  paidDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export type CreateActivityPayment = Omit<ActivityPayment, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateActivityPayment = Partial<Omit<CreateActivityPayment, 'activityId'>>

// Form types for creating/updating entities
export type CreateStudent = Omit<Student, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateStudent = Partial<CreateStudent>

export type CreateSession = Omit<Session, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateSession = Partial<CreateSession>

export type CreateActivity = Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateActivity = Partial<CreateActivity>

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

// IPC API types
export interface DatabaseAPI {
  // Students
  getStudents: () => Promise<Student[]>
  getStudent: (id: string) => Promise<Student | null>
  createStudent: (data: CreateStudent) => Promise<Student>
  updateStudent: (id: string, data: UpdateStudent) => Promise<Student>
  deleteStudent: (id: string) => Promise<void>

  // Subjects
  getSubjects: () => Promise<Subject[]>
  getSubject: (id: string) => Promise<Subject | null>

  // Sessions
  getSessions: (filters?: { studentId?: string; startDate?: string; endDate?: string }) => Promise<Session[]>
  getSession: (id: string) => Promise<Session | null>
  createSession: (data: CreateSession) => Promise<Session>
  updateSession: (id: string, data: UpdateSession) => Promise<Session>
  deleteSession: (id: string) => Promise<void>

  // Activities
  getActivities: (filters?: {
    studentId?: string
    subjectId?: string
    activityType?: ActivityType
    startDate?: string
    endDate?: string
  }) => Promise<Activity[]>
  getActivity: (id: string) => Promise<Activity | null>
  createActivity: (data: CreateActivity) => Promise<Activity>
  updateActivity: (id: string, data: UpdateActivity) => Promise<Activity>
  deleteActivity: (id: string) => Promise<void>

  // Reports
  getActivitySummary: (studentId: string, startDate: string, endDate: string) => Promise<ActivitySummary[]>
  getDailySummaries: (studentId: string, startDate: string, endDate: string) => Promise<DailySummary[]>

  // Milestone Templates
  getMilestoneTemplates: (gradeLevel?: GradeLevel) => Promise<MilestoneTemplate[]>

  // Milestones
  getMilestones: (studentId: string) => Promise<Milestone[]>
  getMilestone: (id: string) => Promise<Milestone | null>
  createMilestone: (data: CreateMilestone) => Promise<Milestone>
  updateMilestone: (id: string, data: UpdateMilestone) => Promise<Milestone>
  deleteMilestone: (id: string) => Promise<void>
  initializeStudentMilestones: (studentId: string, gradeLevel: GradeLevel) => Promise<Milestone[]>
  getSuggestedMilestones: (studentId: string, count: number) => Promise<Milestone[]>

  // Resources
  getResources: (milestoneId: string) => Promise<MilestoneResource[]>
  createResource: (data: CreateResource) => Promise<MilestoneResource>
  deleteResource: (id: string) => Promise<void>
  uploadResourceFile: (milestoneId: string, title: string) => Promise<MilestoneResource | null>
  openResource: (resource: MilestoneResource) => Promise<void>

  // Weekly Plans
  getWeeklyPlan: (studentId: string, weekStart: string) => Promise<WeeklyPlan | null>
  saveWeeklyPlan: (studentId: string, weekStart: string, milestoneIds: string[]) => Promise<WeeklyPlan>

  // Calendar
  fetchCalendarEvents: (feedUrl: string, startDate: string, endDate: string) => Promise<CalendarBusyEvent[]>

  // Library / Books
  getBooks: () => Promise<Book[]>
  getBook: (id: string) => Promise<Book | null>
  createBook: (data: CreateBook) => Promise<Book>
  updateBook: (id: string, data: UpdateBook) => Promise<Book>
  deleteBook: (id: string) => Promise<void>
  getBooksWithProgress: (studentId: string) => Promise<BookWithProgress[]>
  getStudentBook: (studentId: string, bookId: string) => Promise<StudentBook | null>
  updateStudentBook: (studentId: string, bookId: string, data: UpdateStudentBook) => Promise<StudentBook>
  logReading: (studentId: string, bookId: string, pagesRead: number, notes?: string) => Promise<StudentBook>

  // Field Trips / Activities
  getFieldTrips: (filters?: { studentId?: string; status?: FieldTripStatus; activityType?: EventActivityType }) => Promise<FieldTrip[]>
  getFieldTrip: (id: string) => Promise<FieldTrip | null>
  createFieldTrip: (data: CreateFieldTrip) => Promise<FieldTrip>
  updateFieldTrip: (id: string, data: UpdateFieldTrip) => Promise<FieldTrip>
  deleteFieldTrip: (id: string) => Promise<void>
  duplicateActivity: (id: string, options: { newDate: string; copyTasks?: boolean; copyContacts?: boolean }) => Promise<FieldTrip>

  // Activity Tasks
  getActivityTasks: (activityId: string) => Promise<ActivityTask[]>
  createActivityTask: (data: CreateActivityTask) => Promise<ActivityTask>
  updateActivityTask: (id: string, data: UpdateActivityTask) => Promise<ActivityTask>
  deleteActivityTask: (id: string) => Promise<void>
  toggleActivityTask: (id: string) => Promise<ActivityTask>

  // Activity Contacts
  getActivityContacts: (activityId: string) => Promise<ActivityContact[]>
  createActivityContact: (data: CreateActivityContact) => Promise<ActivityContact>
  updateActivityContact: (id: string, data: UpdateActivityContact) => Promise<ActivityContact>
  deleteActivityContact: (id: string) => Promise<void>

  // Activity RSVPs
  getActivityRSVPs: (activityId: string) => Promise<ActivityRSVP[]>
  createActivityRSVP: (data: CreateActivityRSVP) => Promise<ActivityRSVP>
  updateActivityRSVP: (id: string, data: UpdateActivityRSVP) => Promise<ActivityRSVP>
  deleteActivityRSVP: (id: string) => Promise<void>

  // Activity Expenses
  getActivityExpenses: (activityId: string) => Promise<ActivityExpense[]>
  createActivityExpense: (data: CreateActivityExpense) => Promise<ActivityExpense>
  updateActivityExpense: (id: string, data: UpdateActivityExpense) => Promise<ActivityExpense>
  deleteActivityExpense: (id: string) => Promise<void>

  // Activity Payments
  getActivityPayments: (activityId: string) => Promise<ActivityPayment[]>
  createActivityPayment: (data: CreateActivityPayment) => Promise<ActivityPayment>
  updateActivityPayment: (id: string, data: UpdateActivityPayment) => Promise<ActivityPayment>
  deleteActivityPayment: (id: string) => Promise<void>

  // Google Calendar Auth
  getGoogleAuthStatus: () => Promise<{ hasCredentials: boolean; isAuthenticated: boolean }>
  hasGoogleCredentials: () => Promise<boolean>
  saveGoogleCredentials: (credentials: { client_id: string; client_secret: string }) => Promise<boolean>
  connectGoogleCalendar: () => Promise<boolean>
  disconnectGoogleCalendar: () => Promise<boolean>

  // Google Calendar
  listGoogleCalendars: () => Promise<GoogleCalendarInfo[]>
  createGoogleCalendarEvent: (calendarId: string, event: GoogleCalendarEvent) => Promise<string>
  updateGoogleCalendarEvent: (calendarId: string, eventId: string, event: GoogleCalendarEvent) => Promise<void>
  deleteGoogleCalendarEvent: (calendarId: string, eventId: string) => Promise<void>

  // Calendar Sync
  getCalendarSyncRecord: (milestoneId: string, weekStart: string) => Promise<CalendarSyncRecord | null>
  getCalendarSyncRecordsForWeek: (weekStart: string) => Promise<CalendarSyncRecord[]>
  upsertCalendarSyncRecord: (milestoneId: string, weekStart: string, googleEventId: string, calendarId: string) => Promise<CalendarSyncRecord>

  // Skylight Chore Mappings
  getChoreMappings: () => Promise<SubjectChoreMapping[]>
  getChoreMapping: (subjectId: string) => Promise<SubjectChoreMapping | null>
  upsertChoreMapping: (data: CreateChoreMapping) => Promise<SubjectChoreMapping>
  deleteChoreMapping: (subjectId: string) => Promise<void>

  // Rewards
  getStudentRewards: (studentId: string, weekStart?: string) => Promise<StudentReward[]>
  getStudentStarTotals: (studentId: string) => Promise<{ weeklyTotal: number; allTimeTotal: number }>
  createReward: (data: CreateReward) => Promise<StudentReward>
  markRewardsSynced: (rewardIds: string[]) => Promise<void>

  // Family Goals
  getFamilyGoals: () => Promise<FamilyGoal[]>
  getActiveFamilyGoal: () => Promise<FamilyGoal | null>
  createFamilyGoal: (data: CreateFamilyGoal) => Promise<FamilyGoal>
  updateFamilyGoal: (id: string, data: UpdateFamilyGoal) => Promise<FamilyGoal>
  deleteFamilyGoal: (id: string) => Promise<void>
  achieveFamilyGoal: (id: string) => Promise<FamilyGoal>
  getFamilyTotalStars: () => Promise<number>
  deleteCalendarSyncRecord: (milestoneId: string, weekStart: string) => Promise<void>
  deleteCalendarSyncRecordsForWeek: (weekStart: string) => Promise<void>

  // User Settings
  getSetting: (key: string) => Promise<string | null>
  setSetting: (key: string, value: string) => Promise<void>
  deleteSetting: (key: string) => Promise<void>

  // Book Scanner
  startScanner: () => Promise<ScannerSession>
  stopScanner: () => Promise<void>
  getScannerStatus: () => Promise<{ isRunning: boolean; channelId: string | null }>
  onBookScanned: (callback: (book: Book) => void) => () => void

  // Recurring Activities
  getRecurringActivities: (studentId?: string) => Promise<RecurringActivity[]>
  getRecurringActivity: (id: string) => Promise<RecurringActivity | null>
  createRecurringActivity: (data: CreateRecurringActivity) => Promise<RecurringActivity>
  updateRecurringActivity: (id: string, data: UpdateRecurringActivity) => Promise<RecurringActivity | null>
  deleteRecurringActivity: (id: string) => Promise<boolean>
  getDueRecurringActivities: (studentId?: string, date?: string) => Promise<RecurringActivity[]>
  markRecurringActivityLogged: (id: string, date: string) => Promise<void>

  // Activity Attachments
  getAttachmentsForActivity: (activityId: string) => Promise<ActivityAttachment[]>
  getAttachment: (id: string) => Promise<ActivityAttachment | null>
  addAttachment: (activityId: string) => Promise<ActivityAttachment | null>
  deleteAttachment: (id: string) => Promise<boolean>
  openAttachmentFile: (filePath: string) => Promise<void>
  getAttachmentsForActivities: (activityIds: string[]) => Promise<Record<string, ActivityAttachment[]>>
}

// Google Calendar Types
export interface GoogleCalendarInfo {
  id: string
  summary: string
  primary?: boolean
}

export interface GoogleCalendarEvent {
  summary: string
  description?: string
  start: string
  end: string
  allDay: boolean
  colorId?: string
}

export interface CalendarSyncRecord {
  id: string
  milestoneId: string
  weekStart: string
  googleEventId: string
  calendarId: string
  syncedAt: string
}

// Family Sync Types
export interface SyncPeerInfo {
  peerId: string
  deviceId: string
  deviceName?: string
  lastSeen?: number
  isOnline: boolean
}

export interface SyncFamilyStatus {
  isConfigured: boolean
  isCreator: boolean
  familyId: string | null
  deviceId: string | null
  deviceName: string | null
}

export type SyncState = 'synced' | 'syncing' | 'offline' | 'error'

export interface SyncStatus {
  isEnabled: boolean
  isConnected: boolean
  familyStatus: SyncFamilyStatus
  connectedPeers: SyncPeerInfo[]
  pendingEvents: number
  syncState: SyncState
  lastSyncTime: string | null // ISO timestamp
  errorMessage?: string
}

export interface SyncLogStats {
  length: number
  lastEventId: string | null
}

export interface SyncAPI {
  // Initialization
  syncInitialize: () => Promise<{ success: boolean }>

  // Status
  syncGetStatus: () => Promise<SyncStatus>
  syncGetPeers: () => Promise<SyncPeerInfo[]>
  syncGetLogStats: () => Promise<SyncLogStats>

  // Family Management
  syncCreateFamily: (deviceName: string) => Promise<{ success: boolean; config?: unknown; error?: string }>
  syncJoinFamily: (qrData: string, deviceName: string) => Promise<{ success: boolean; config?: unknown; error?: string }>
  syncLeaveFamily: () => Promise<{ success: boolean; error?: string }>
  syncGetQRCode: () => Promise<{ success: boolean; qrData?: string }>
  syncUpdateDeviceName: (name: string) => Promise<{ success: boolean; error?: string }>
  syncShareInvite: (method: 'email' | 'sms', inviteCode: string) => Promise<void>
  syncGetInviteMessage: (inviteCode: string) => Promise<{ success: boolean; message: string }>

  // Member Management
  syncIsManager: () => Promise<boolean>
  syncKickMember: (deviceId: string, deviceName: string, reason?: string) => Promise<{ success: boolean; error?: string }>
  syncGetKickedMembers: () => Promise<Array<{ deviceId: string; deviceName: string; kickedAt: string; reason?: string }>>

  // Event listeners
  onSyncPeerConnected: (callback: (peerId: string) => void) => () => void
  onSyncPeerDisconnected: (callback: (peerId: string) => void) => () => void
  onSyncEventReceived: (callback: (data: { event: unknown; fromPeer: string }) => void) => () => void
  onSyncCompleted: (callback: (data: { peerId: string; eventsReceived: number }) => void) => () => void

  // Recovery
  syncCheckHealth: () => Promise<SyncRecoveryStatus>
  syncReset: () => Promise<SyncRecoveryResult>
  syncRecover: () => Promise<SyncRecoveryResult>
  syncListBackups: () => Promise<SyncBackup[]>
  syncRestoreBackup: (backupName: string) => Promise<SyncRecoveryResult>
}

export interface SyncRecoveryStatus {
  isCorrupted: boolean
  corruptionDetails?: string
  eventLogLength: number
  lastEventId: string | null
  canRecover: boolean
}

export interface SyncRecoveryResult {
  success: boolean
  message: string
  eventsRecovered?: number
  backupPath?: string
}

export interface SyncBackup {
  name: string
  timestamp: number
  path: string
}

declare global {
  interface Window {
    api: DatabaseAPI & SyncAPI
  }
}
