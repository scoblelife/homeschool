import type {
  ActivityType,
  AssessmentType,
  AttendanceStatus,
  CoopMemberRole,
  ContactRole,
  EventCategory,
  ExpenseCategory,
  GradeLevel,
  MentorExpertise,
  MentorRequestStatus,
  PaymentStatus,
  ReadingStatus,
  RecurrencePattern,
  RSVPStatus,
  SharedResourceType,
  SponsoredLocation,
  SponsorTier,
  StandardSet,
  SyncState,
  TaskPhase,
  UmbrellaEnrollmentStatus,
  UmbrellaReportFrequency,
  UmbrellaReportStatus,
  UmbrellaReportType,
  UniversalStatus
} from './enums'

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
  activitySubType?: string  // Optional sub-type: 'print'|'cursive' for writing, 'game'|'test'|'event' for interactive
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
  status: UniversalStatus  // Using unified status system
  evidenceNotes: string
  starValue: number
  createdAt: string
  updatedAt: string
}

export interface Assessment {
  id: string
  studentId: string
  type: AssessmentType
  name: string
  provider: string | null
  date: string
  scheduledTime: string | null
  location: string | null
  status: UniversalStatus  // Using unified status system
  score: string | null
  percentile: number | null
  gradeEquivalent: string | null
  resultsUrl: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

// Skylight Integration
export interface SubjectChoreMapping {
  id: string
  subjectId: string
  choreName: string
  defaultStars: number
  createdAt: string
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

// Email Summary Types
export interface EmailStudentSummary {
  name: string
  gradeLevel: string
  totalActivities: number
  totalMinutes: number
  activeDays: number
  subjects: Array<{
    name: string
    activities: number
    minutes: number
  }>
}

export interface WeeklySummaryEmailData {
  weekStart: string
  weekEnd: string
  students: EmailStudentSummary[]
  familyTotalActivities: number
  familyTotalMinutes: number
}

export interface EmailSummaryConfig {
  enabled: boolean
  recipientEmail: string
  method: 'mailto' | 'resend'
  resendApiKey?: string
}

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

export interface WeeklyPlan {
  id: string
  studentId: string
  weekStart: string
  milestoneIds: string[]
  createdAt: string
  updatedAt: string
}

// Library / Book tracking
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

// Field Trips / Activities
export interface FieldTrip {
  id: string
  title: string
  activityType: ActivityType  // Always 'interactive' for field trips
  eventCategory: EventCategory  // NEW: Educational, social, or co-op
  location: string
  description?: string
  date: string
  startTime?: string
  endTime?: string
  status: UniversalStatus  // Using unified status system
  studentIds: string[]
  subjectIds: string[]
  cost?: number
  websiteUrl?: string
  notes?: string
  learningOutcomes?: string
  createdAt: string
  updatedAt: string
}

// Field Trip to Activity linking
export interface FieldTripActivity {
  id: string
  fieldTripId: string
  activityId: string
  createdAt: string
}

// Co-op Groups
export interface CoopGroup {
  id: string
  name: string
  description?: string
  inviteCode: string
  createdBy: string // device ID that created the group
  createdAt: string
  updatedAt: string
}

export interface CoopMember {
  id: string
  groupId: string
  familyName: string
  email?: string
  phone?: string
  role: CoopMemberRole
  joinedAt: string
}

// Co-op Events (shared field trips and events)
export interface CoopEvent {
  id: string
  groupId: string
  fieldTripId?: string // Optional link to a FieldTrip
  title: string
  description?: string
  location: string
  date: string
  startTime?: string
  endTime?: string
  organizerId: string // CoopMember id
  maxAttendees?: number
  createdAt: string
  updatedAt: string
}

// Co-op Sharing Preferences
export interface CoopSharingPreferences {
  id: string
  groupId: string
  shareEvents: boolean
  shareResources: boolean
  shareReadingLists: boolean
  sharePackages: boolean
  updatedAt: string
}

// Shared Resources (resources shared with co-op groups)
export interface SharedResource {
  id: string
  groupId: string
  sharedBy: string // CoopMember id
  resourceType: SharedResourceType
  title: string
  description?: string
  url?: string
  subject?: string
  gradeLevel?: string
  averageRating: number
  ratingCount: number
  createdAt: string
  updatedAt: string
}

export interface ResourceRating {
  id: string
  resourceId: string
  memberId: string // CoopMember id
  rating: number // 1-5
  review?: string
  createdAt: string
}

// Mentor Matching
export interface MentorProfile {
  id: string
  memberId: string // CoopMember id
  yearsHomeschooling: number
  expertise: MentorExpertise[]
  bio: string
  maxMentees: number
  currentMenteeCount: number
  isAcceptingRequests: boolean
  contactEmail?: string
  contactPhone?: string
  createdAt: string
  updatedAt: string
}

export interface MentorRequest {
  id: string
  mentorId: string // MentorProfile id
  requesterId: string // CoopMember id
  message: string
  status: MentorRequestStatus
  responseMessage?: string
  createdAt: string
  updatedAt: string
}

// Activity Tasks (todos for field trips/activities)
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

// Activity Contacts (venue contacts, organizers, etc.)
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

// Activity RSVPs (for group events)
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

// Activity Expenses
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

// Activity Payments (for group events - tracking who has paid)
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

// Attendance Types
export interface AttendanceRecord {
  id: string
  studentId: string
  date: string
  status: AttendanceStatus
  notes?: string
  createdAt: string
}

// Curriculum Mapping Types
export interface LearningStandard {
  id: string
  code: string
  title: string
  description: string
  gradeLevel: GradeLevel
  subjectId: string
  domain: string
  cluster?: string
  standardSet: StandardSet
}

export interface ActivityStandardMapping {
  id: string
  activityId: string
  standardId: string
  createdAt: string
}

export interface CustomStandard {
  id: string
  code: string
  title: string
  description?: string
  gradeLevel: GradeLevel
  subjectId: string
  domain: string
  createdAt: string
  updatedAt: string
}

// Curriculum Packages (Commercial Curriculum Products)
export interface CurriculumPackage {
  id: string
  name: string
  publisher?: string
  subjectIds: string[]  // JSON array stored as string in DB
  gradeLevels: GradeLevel[]  // JSON array stored as string in DB
  websiteUrl?: string
  notes?: string
  isSponsored?: boolean  // True if this curriculum has a sponsorship partnership
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Portfolio Types
export interface PortfolioSection {
  id: string
  name: string
  enabled: boolean
}

export interface PortfolioConfig {
  title: string
  subtitle?: string
  schoolYear: string
  studentId: string
  dateRange: {
    startDate: string
    endDate: string
  }
  sections: PortfolioSection[]
  includePhotos: boolean
  includeSummaryStats: boolean
}

export interface GeneratePDFResult {
  success: boolean
  filePath?: string
  error?: string
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

// AI Insights API
export interface AIConfig {
  apiKey: string | null
  enabled: boolean
  cacheEnabled: boolean
}

export interface AICompleteOptions {
  maxTokens?: number
  temperature?: number
  systemPrompt?: string
  useCache?: boolean
}

// ============ Compliance Types ============

export interface StateRequirement {
  state: string
  stateCode: string
  requiresNotice: boolean
  noticeDeadline?: string
  requiredSubjects: string[]
  recordKeeping: 'none' | 'attendance' | 'portfolio' | 'detailed'
  assessmentRequired: boolean
  assessmentType?: 'standardized_test' | 'evaluation' | 'either' | 'none'
  assessmentFrequency?: string
  minHours?: number
  minDays?: number
  teacherQualifications: string
  filingDeadlines: Array<{
    name: string
    date: string
    description: string
  }>
  notes?: string
}

export interface ComplianceDeadline {
  name: string
  date: Date
  description: string
  daysUntil: number
}

export interface ComplianceDocumentData {
  students: Student[]
  parentName: string
  address: string
  city: string
  state: string
  zip: string
  phone?: string
  email?: string
  schoolYear: string
  schoolName?: string
}

export interface GeneratedDocument {
  title: string
  content: string
  format: 'text' | 'html'
}

// Umbrella School Types (Cover Schools)
export interface UmbrellaSchoolRequirement {
  name: string
  description: string
  frequency: UmbrellaReportFrequency
  required: boolean
}

export interface UmbrellaSchool {
  id: string
  name: string
  state: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  websiteUrl?: string
  address?: string
  enrollmentFee?: number
  annualFee?: number
  enrollmentStartDate?: string
  enrollmentEndDate?: string
  reportFrequency?: UmbrellaReportFrequency
  reportDueDay?: number // Day of month/quarter when reports are due
  requirements: UmbrellaSchoolRequirement[]
  notes?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface UmbrellaSchoolEnrollment {
  id: string
  umbrellaSchoolId: string
  studentId: string
  studentIdAtSchool?: string // ID assigned by the umbrella school
  gradeLevel?: string
  enrolledDate: string
  withdrawnDate?: string
  status: UmbrellaEnrollmentStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface UmbrellaSchoolReport {
  id: string
  umbrellaSchoolId: string
  studentId: string
  reportType: UmbrellaReportType
  periodStart: string
  periodEnd: string
  dueDate?: string
  submittedDate?: string
  status: UmbrellaReportStatus
  content?: Record<string, unknown> // Flexible content based on report type
  filePath?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

// ============================================
// Sponsorship Types (Privacy-First)
// ============================================

export interface Sponsor {
  id: string
  name: string
  tier: SponsorTier
  logoUrl?: string
  websiteUrl?: string
  description?: string
  monthlyFee: number
  contactName?: string
  contactEmail: string
  githubUsername?: string // For Enterprise PR access
  isActive: boolean
  contractSignedDate?: string
  billingStartDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface SponsoredResource {
  id: string
  sponsorId: string
  tier: SponsorTier
  name: string
  description: string
  icon?: string
  url: string
  subjects: string[]
  gradeLevels: string[]
  category?: string
  pricingInfo?: string
  displayPriority: number
  isActive: boolean
  contractStartDate: string
  contractEndDate: string
  createdAt: string
  updatedAt: string
}

export interface SponsoredClick {
  id: string
  sponsoredResourceId: string
  location: SponsoredLocation
  clickedAt: string
}

// Analytics aggregates (no PII)
export interface SponsorAnalytics {
  sponsorId: string
  sponsorName: string
  tier: SponsorTier
  monthlyFee: number
  totalClicks: number
  clicksByLocation: Record<SponsoredLocation, number>
  clicksByResource: Array<{
    resourceId: string
    resourceName: string
    clicks: number
  }>
}
