// API interface types for IPC communication
// Note: The `declare global { interface Window { api: ... } }` declaration
// stays in apps/desktop/src/shared/ since it's Electron-specific.
// These interfaces are exported for type reuse across packages.

import type {
  ActivityType, GradeLevel, UniversalStatus, EventCategory,
  MentorRequestStatus, SponsorTier, SponsoredLocation
} from './enums'
import type {
  Student, Subject, Session, Activity, Milestone, MilestoneTemplate,
  MilestoneResource, WeeklyPlan, CalendarBusyEvent, Book, StudentBook,
  BookWithProgress, FieldTrip, FieldTripActivity, Assessment,
  StudentReward, FamilyGoal, RecurringActivity,
  ActivityAttachment, ActivityTask, ActivityContact, ActivityRSVP,
  ActivityExpense, ActivityPayment, AttendanceRecord, LearningStandard,
  ActivityStandardMapping, CustomStandard, CurriculumPackage,
  PortfolioConfig, GeneratePDFResult, GoogleCalendarInfo, GoogleCalendarEvent,
  CalendarSyncRecord, ScannerSession, CoopGroup, CoopMember, CoopEvent,
  CoopSharingPreferences, SharedResource, ResourceRating, MentorProfile,
  MentorRequest, Sponsor, SponsoredResource, SponsorAnalytics,
  UmbrellaSchool, UmbrellaSchoolEnrollment, UmbrellaSchoolReport,
  SyncStatus, SyncPeerInfo, SyncLogStats, SyncRecoveryStatus,
  SyncRecoveryResult, SyncBackup, AIConfig, AICompleteOptions,
  StateRequirement, ComplianceDeadline, ComplianceDocumentData,
  GeneratedDocument
} from './entities'
import type {
  CreateStudent, UpdateStudent, CreateSession, UpdateSession,
  CreateActivity, UpdateActivity, CreateMilestone, UpdateMilestone,
  CreateAssessment, UpdateAssessment,
  CreateReward, CreateFamilyGoal, UpdateFamilyGoal,
  CreateRecurringActivity, UpdateRecurringActivity,
  CreateResource, CreateBook, UpdateBook, UpdateStudentBook,
  CreateFieldTrip, UpdateFieldTrip, CreateActivityTask, UpdateActivityTask,
  CreateActivityContact, UpdateActivityContact, CreateActivityRSVP,
  UpdateActivityRSVP, CreateActivityExpense, UpdateActivityExpense,
  CreateActivityPayment, UpdateActivityPayment, CreateAttendanceRecord,
  CreateCustomStandard, UpdateCustomStandard, CreateCurriculumPackage,
  UpdateCurriculumPackage, CreateCoopGroup, UpdateCoopGroup,
  CreateCoopMember, UpdateCoopMember, CreateCoopEvent, UpdateCoopEvent,
  UpdateCoopSharingPreferences, CreateSharedResource, UpdateSharedResource,
  CreateResourceRating, CreateMentorProfile, UpdateMentorProfile,
  CreateMentorRequest, CreateSponsor, UpdateSponsor,
  CreateSponsoredResource, UpdateSponsoredResource,
  CreateUmbrellaSchool, UpdateUmbrellaSchool,
  CreateUmbrellaSchoolEnrollment, UpdateUmbrellaSchoolEnrollment,
  CreateUmbrellaSchoolReport, UpdateUmbrellaSchoolReport
} from './forms'
import type { ActivitySummary, DailySummary, CurriculumReport, StandardCoverage } from './reports'

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

  // Field Trips
  getFieldTrips: (filters?: { studentId?: string; status?: UniversalStatus; eventCategory?: EventCategory }) => Promise<FieldTrip[]>
  getFieldTrip: (id: string) => Promise<FieldTrip | null>
  createFieldTrip: (data: CreateFieldTrip) => Promise<FieldTrip>
  updateFieldTrip: (id: string, data: UpdateFieldTrip) => Promise<FieldTrip>
  deleteFieldTrip: (id: string) => Promise<void>
  duplicateActivity: (id: string, options: { newDate: string; copyTasks?: boolean; copyContacts?: boolean }) => Promise<FieldTrip>

  // Field Trip Activity Linking
  linkActivityToFieldTrip: (data: { fieldTripId: string; activityId: string }) => Promise<FieldTripActivity>
  unlinkActivityFromFieldTrip: (fieldTripId: string, activityId: string) => Promise<void>
  getLinkedActivities: (fieldTripId: string) => Promise<FieldTripActivity[]>
  getFieldTripsForActivity: (activityId: string) => Promise<FieldTripActivity[]>

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

  // Attendance
  getAttendanceRecords: (studentId: string, startDate: string, endDate: string) => Promise<AttendanceRecord[]>
  getAttendanceRecord: (studentId: string, date: string) => Promise<AttendanceRecord | null>
  setAttendanceRecord: (data: CreateAttendanceRecord) => Promise<AttendanceRecord>
  deleteAttendanceRecord: (studentId: string, date: string) => Promise<void>
  getAttendanceStats: (studentId: string, startDate: string, endDate: string) => Promise<{
    totalDays: number
    schoolDays: number
    absences: number
    percentage: number
  }>

  // Portfolio
  generatePortfolioPDF: (config: PortfolioConfig) => Promise<GeneratePDFResult>
  previewPortfolioHTML: (config: PortfolioConfig) => Promise<string>
  getPortfolioDefaultConfig: (studentId: string, schoolYear: string) => Promise<PortfolioConfig>
  getCurrentSchoolYear: () => Promise<string>
  openPortfolioFile: (filePath: string) => Promise<void>

  // Data Export
  exportDataJSON: () => Promise<{ success: boolean; filePath?: string; error?: string }>
  exportActivitiesCSV: () => Promise<{ success: boolean; filePath?: string; error?: string }>

  // Curriculum Mapping
  getAllStandards: (gradeLevel?: GradeLevel) => Promise<LearningStandard[]>
  getStandard: (id: string) => Promise<LearningStandard | null>
  createCustomStandard: (data: CreateCustomStandard) => Promise<CustomStandard>
  updateCustomStandard: (id: string, data: UpdateCustomStandard) => Promise<CustomStandard | null>
  deleteCustomStandard: (id: string) => Promise<void>
  getActivityStandards: (activityId: string) => Promise<LearningStandard[]>
  addActivityStandard: (activityId: string, standardId: string) => Promise<ActivityStandardMapping>
  removeActivityStandard: (activityId: string, standardId: string) => Promise<void>
  setActivityStandards: (activityId: string, standardIds: string[]) => Promise<void>
  getStandardCoverage: (studentId: string, gradeLevel: GradeLevel, startDate?: string, endDate?: string) => Promise<StandardCoverage[]>
  getCurriculumReport: (studentId: string, gradeLevel: GradeLevel, startDate?: string, endDate?: string) => Promise<CurriculumReport>

  // Curriculum Packages
  getCurriculumPackages: () => Promise<CurriculumPackage[]>
  getCurriculumPackage: (id: string) => Promise<CurriculumPackage | null>
  createCurriculumPackage: (data: CreateCurriculumPackage) => Promise<CurriculumPackage>
  updateCurriculumPackage: (id: string, data: UpdateCurriculumPackage) => Promise<CurriculumPackage>
  deleteCurriculumPackage: (id: string) => Promise<void>

  // Co-op Groups
  getCoopGroups: () => Promise<CoopGroup[]>
  getCoopGroup: (id: string) => Promise<CoopGroup | null>
  getCoopGroupByInviteCode: (inviteCode: string) => Promise<CoopGroup | null>
  createCoopGroup: (data: CreateCoopGroup) => Promise<CoopGroup>
  updateCoopGroup: (id: string, data: UpdateCoopGroup) => Promise<CoopGroup>
  deleteCoopGroup: (id: string) => Promise<void>
  regenerateCoopInviteCode: (groupId: string) => Promise<string>

  // Co-op Members
  getCoopMembers: (groupId: string) => Promise<CoopMember[]>
  getCoopMember: (id: string) => Promise<CoopMember | null>
  createCoopMember: (data: CreateCoopMember) => Promise<CoopMember>
  updateCoopMember: (id: string, data: UpdateCoopMember) => Promise<CoopMember>
  deleteCoopMember: (id: string) => Promise<void>

  // Co-op Events
  getCoopEvents: (groupId: string) => Promise<CoopEvent[]>
  getAllUpcomingCoopEvents: () => Promise<(CoopEvent & { groupName: string; organizerName: string })[]>
  getCoopEvent: (id: string) => Promise<CoopEvent | null>
  createCoopEvent: (data: CreateCoopEvent) => Promise<CoopEvent>
  updateCoopEvent: (id: string, data: UpdateCoopEvent) => Promise<CoopEvent>
  deleteCoopEvent: (id: string) => Promise<void>

  // Co-op Sharing Preferences
  getCoopSharingPreferences: (groupId: string) => Promise<CoopSharingPreferences>
  updateCoopSharingPreferences: (groupId: string, data: UpdateCoopSharingPreferences) => Promise<CoopSharingPreferences>

  // Shared Resources
  getSharedResources: (groupId: string) => Promise<(SharedResource & { sharedByName: string })[]>
  getAllSharedResources: () => Promise<(SharedResource & { groupName: string; sharedByName: string })[]>
  getSharedResource: (id: string) => Promise<SharedResource | null>
  createSharedResource: (data: CreateSharedResource) => Promise<SharedResource>
  updateSharedResource: (id: string, data: UpdateSharedResource) => Promise<SharedResource>
  deleteSharedResource: (id: string) => Promise<void>
  getResourceRatings: (resourceId: string) => Promise<(ResourceRating & { memberName: string })[]>
  createResourceRating: (data: CreateResourceRating) => Promise<ResourceRating>
  deleteResourceRating: (id: string) => Promise<void>

  // Mentor Matching
  getMentorProfiles: () => Promise<(MentorProfile & { memberName: string; groupName: string })[]>
  getMentorProfile: (id: string) => Promise<MentorProfile | null>
  getMyMentorProfile: (memberId: string) => Promise<MentorProfile | null>
  createMentorProfile: (data: CreateMentorProfile) => Promise<MentorProfile>
  updateMentorProfile: (id: string, data: UpdateMentorProfile) => Promise<MentorProfile>
  deleteMentorProfile: (id: string) => Promise<void>
  getMentorRequests: (mentorId: string) => Promise<(MentorRequest & { requesterName: string })[]>
  getMyMentorRequests: (requesterId: string) => Promise<(MentorRequest & { mentorName: string })[]>
  createMentorRequest: (data: CreateMentorRequest) => Promise<MentorRequest>
  respondToMentorRequest: (id: string, status: MentorRequestStatus, responseMessage?: string) => Promise<MentorRequest>

  // Assessments
  getAssessments: (studentId?: string) => Promise<Assessment[]>
  getAssessment: (id: string) => Promise<Assessment | null>
  getUpcomingAssessments: (studentId?: string) => Promise<Assessment[]>
  createAssessment: (data: CreateAssessment) => Promise<Assessment>
  updateAssessment: (id: string, data: UpdateAssessment) => Promise<Assessment | null>
  deleteAssessment: (id: string) => Promise<void>
}

export interface SyncAPI {
  syncInitialize: () => Promise<{ success: boolean }>
  syncGetStatus: () => Promise<SyncStatus>
  syncGetPeers: () => Promise<SyncPeerInfo[]>
  syncGetLogStats: () => Promise<SyncLogStats>
  syncCreateFamily: (deviceName: string) => Promise<{ success: boolean; config?: unknown; error?: string }>
  syncJoinFamily: (qrData: string, deviceName: string) => Promise<{ success: boolean; config?: unknown; error?: string }>
  syncLeaveFamily: () => Promise<{ success: boolean; error?: string }>
  syncGetQRCode: () => Promise<{ success: boolean; qrData?: string }>
  syncUpdateDeviceName: (name: string) => Promise<{ success: boolean; error?: string }>
  syncShareInvite: (method: 'email' | 'sms', inviteCode: string) => Promise<void>
  syncGetInviteMessage: (inviteCode: string) => Promise<{ success: boolean; message: string }>
  syncIsManager: () => Promise<boolean>
  syncKickMember: (deviceId: string, deviceName: string, reason?: string) => Promise<{ success: boolean; error?: string }>
  syncGetKickedMembers: () => Promise<Array<{ deviceId: string; deviceName: string; kickedAt: string; reason?: string }>>
  onSyncPeerConnected: (callback: (peerId: string) => void) => () => void
  onSyncPeerDisconnected: (callback: (peerId: string) => void) => () => void
  onSyncEventReceived: (callback: (data: { event: unknown; fromPeer: string }) => void) => () => void
  onSyncCompleted: (callback: (data: { peerId: string; eventsReceived: number }) => void) => () => void
  syncCheckHealth: () => Promise<SyncRecoveryStatus>
  syncReset: () => Promise<SyncRecoveryResult>
  syncRecover: () => Promise<SyncRecoveryResult>
  syncListBackups: () => Promise<SyncBackup[]>
  syncRestoreBackup: (backupName: string) => Promise<SyncRecoveryResult>
}

export interface AIAPI {
  aiInitialize: () => Promise<{ success: boolean }>
  aiIsAvailable: () => Promise<boolean>
  aiGetConfig: () => Promise<AIConfig>
  aiSetApiKey: (apiKey: string | null) => Promise<{ success: boolean }>
  aiSetEnabled: (enabled: boolean) => Promise<{ success: boolean }>
  aiComplete: (prompt: string, options?: AICompleteOptions) => Promise<{ success: boolean; response?: string; error?: string }>
  aiClearCache: () => Promise<{ success: boolean }>
}

export interface ComplianceAPI {
  complianceGetSupportedStates: () => Promise<Array<{ code: string; name: string }>>
  complianceGetStateRequirements: (stateCode: string) => Promise<StateRequirement | null>
  complianceGetUpcomingDeadlines: (stateCode: string, referenceDate?: string) => Promise<ComplianceDeadline[]>
  complianceGenerateNoticeOfIntent: (data: ComplianceDocumentData) => Promise<GeneratedDocument>
  complianceGenerateAttendanceRecord: (
    data: ComplianceDocumentData,
    attendanceData: Array<{ date: string; status: string }>
  ) => Promise<GeneratedDocument>
  complianceGenerateIHIP: (
    data: ComplianceDocumentData,
    curriculum: Array<{ subject: string; materials: string; goals: string }>
  ) => Promise<GeneratedDocument>
  complianceGenerateQuarterlyReport: (
    data: ComplianceDocumentData,
    quarter: 1 | 2 | 3 | 4,
    activities: Array<{ subject: string; description: string; hours: number }>
  ) => Promise<GeneratedDocument>
}

export interface UmbrellaSchoolAPI {
  umbrellaGetSchools: () => Promise<UmbrellaSchool[]>
  umbrellaGetSchool: (id: string) => Promise<UmbrellaSchool | null>
  umbrellaCreateSchool: (data: CreateUmbrellaSchool) => Promise<UmbrellaSchool>
  umbrellaUpdateSchool: (id: string, data: UpdateUmbrellaSchool) => Promise<UmbrellaSchool | null>
  umbrellaDeleteSchool: (id: string) => Promise<void>
  umbrellaGetEnrollments: (schoolId?: string, studentId?: string) => Promise<UmbrellaSchoolEnrollment[]>
  umbrellaGetEnrollment: (id: string) => Promise<UmbrellaSchoolEnrollment | null>
  umbrellaCreateEnrollment: (data: CreateUmbrellaSchoolEnrollment) => Promise<UmbrellaSchoolEnrollment>
  umbrellaUpdateEnrollment: (id: string, data: UpdateUmbrellaSchoolEnrollment) => Promise<UmbrellaSchoolEnrollment | null>
  umbrellaDeleteEnrollment: (id: string) => Promise<void>
  umbrellaGetReports: (schoolId?: string, studentId?: string) => Promise<UmbrellaSchoolReport[]>
  umbrellaGetReport: (id: string) => Promise<UmbrellaSchoolReport | null>
  umbrellaCreateReport: (data: CreateUmbrellaSchoolReport) => Promise<UmbrellaSchoolReport>
  umbrellaUpdateReport: (id: string, data: UpdateUmbrellaSchoolReport) => Promise<UmbrellaSchoolReport | null>
  umbrellaDeleteReport: (id: string) => Promise<void>
  umbrellaGetPendingReports: (schoolId?: string) => Promise<UmbrellaSchoolReport[]>
  umbrellaGenerateReport: (
    reportId: string,
    format: 'html' | 'pdf'
  ) => Promise<{ success: boolean; content?: string; filePath?: string; error?: string }>
}

export interface StateRequirementsOTAAPI {
  stateRequirementsGetData: () => Promise<unknown>
  stateRequirementsGetUpdateStatus: () => Promise<{
    lastChecked: string | null
    dataVersion: string | null
    source: string
  }>
  stateRequirementsCheckForUpdate: () => Promise<boolean>
  onStateRequirementsUpdated: (callback: () => void) => () => void
}

export interface SponsorshipAPI {
  getSponsors: (activeOnly?: boolean) => Promise<Sponsor[]>
  getSponsor: (id: string) => Promise<Sponsor | null>
  createSponsor: (data: CreateSponsor) => Promise<Sponsor>
  updateSponsor: (id: string, data: UpdateSponsor) => Promise<Sponsor | null>
  deleteSponsor: (id: string) => Promise<void>
  getSponsoredResources: (filters?: {
    tier?: SponsorTier
    subjects?: string[]
    gradeLevels?: string[]
    location?: SponsoredLocation
    activeOnly?: boolean
    limit?: number
  }) => Promise<SponsoredResource[]>
  getSponsoredResource: (id: string) => Promise<SponsoredResource | null>
  createSponsoredResource: (data: CreateSponsoredResource) => Promise<SponsoredResource>
  updateSponsoredResource: (id: string, data: UpdateSponsoredResource) => Promise<SponsoredResource | null>
  deleteSponsoredResource: (id: string) => Promise<void>
  trackSponsoredClick: (data: {
    sponsoredResourceId: string
    location: SponsoredLocation
  }) => Promise<void>
  getSponsorAnalytics: (filters?: {
    sponsorId?: string
    startDate?: string
    endDate?: string
  }) => Promise<SponsorAnalytics[]>
}
