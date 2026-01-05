import { contextBridge, ipcRenderer } from 'electron'
import type {
  DatabaseAPI,
  CreateStudent,
  UpdateStudent,
  CreateSession,
  UpdateSession,
  CreateActivity,
  UpdateActivity,
  CreateMilestone,
  UpdateMilestone,
  CreateResource,
  MilestoneResource,
  ActivityType,
  GradeLevel,
  CreateBook,
  UpdateBook,
  UpdateStudentBook,
  CreateFieldTrip,
  UpdateFieldTrip,
  FieldTripStatus,
  EventActivityType,
  CreateActivityTask,
  UpdateActivityTask,
  CreateActivityContact,
  UpdateActivityContact,
  CreateActivityRSVP,
  UpdateActivityRSVP,
  CreateActivityExpense,
  UpdateActivityExpense,
  CreateActivityPayment,
  UpdateActivityPayment,
  CreateChoreMapping,
  CreateReward,
  CreateFamilyGoal,
  UpdateFamilyGoal,
  Book
} from '../shared/types'

const api: DatabaseAPI = {
  // Students
  getStudents: () => ipcRenderer.invoke('db:students:getAll'),
  getStudent: (id: string) => ipcRenderer.invoke('db:students:get', id),
  createStudent: (data: CreateStudent) => ipcRenderer.invoke('db:students:create', data),
  updateStudent: (id: string, data: UpdateStudent) =>
    ipcRenderer.invoke('db:students:update', id, data),
  deleteStudent: (id: string) => ipcRenderer.invoke('db:students:delete', id),

  // Subjects
  getSubjects: () => ipcRenderer.invoke('db:subjects:getAll'),
  getSubject: (id: string) => ipcRenderer.invoke('db:subjects:get', id),

  // Sessions
  getSessions: (filters?: { studentId?: string; startDate?: string; endDate?: string }) =>
    ipcRenderer.invoke('db:sessions:getAll', filters),
  getSession: (id: string) => ipcRenderer.invoke('db:sessions:get', id),
  createSession: (data: CreateSession) => ipcRenderer.invoke('db:sessions:create', data),
  updateSession: (id: string, data: UpdateSession) =>
    ipcRenderer.invoke('db:sessions:update', id, data),
  deleteSession: (id: string) => ipcRenderer.invoke('db:sessions:delete', id),

  // Activities
  getActivities: (filters?: {
    studentId?: string
    subjectId?: string
    activityType?: ActivityType
    startDate?: string
    endDate?: string
  }) => ipcRenderer.invoke('db:activities:getAll', filters),
  getActivity: (id: string) => ipcRenderer.invoke('db:activities:get', id),
  createActivity: (data: CreateActivity) => ipcRenderer.invoke('db:activities:create', data),
  updateActivity: (id: string, data: UpdateActivity) =>
    ipcRenderer.invoke('db:activities:update', id, data),
  deleteActivity: (id: string) => ipcRenderer.invoke('db:activities:delete', id),

  // Reports
  getActivitySummary: (studentId: string, startDate: string, endDate: string) =>
    ipcRenderer.invoke('db:reports:activitySummary', studentId, startDate, endDate),
  getDailySummaries: (studentId: string, startDate: string, endDate: string) =>
    ipcRenderer.invoke('db:reports:dailySummaries', studentId, startDate, endDate),

  // Milestone Templates
  getMilestoneTemplates: (gradeLevel?: GradeLevel) =>
    ipcRenderer.invoke('db:milestones:templates', gradeLevel),

  // Milestones
  getMilestones: (studentId: string) => ipcRenderer.invoke('db:milestones:getAll', studentId),
  getMilestone: (id: string) => ipcRenderer.invoke('db:milestones:get', id),
  createMilestone: (data: CreateMilestone) => ipcRenderer.invoke('db:milestones:create', data),
  updateMilestone: (id: string, data: UpdateMilestone) =>
    ipcRenderer.invoke('db:milestones:update', id, data),
  deleteMilestone: (id: string) => ipcRenderer.invoke('db:milestones:delete', id),
  initializeStudentMilestones: (studentId: string, gradeLevel: GradeLevel) =>
    ipcRenderer.invoke('db:milestones:initStudent', studentId, gradeLevel),
  getSuggestedMilestones: (studentId: string, count: number) =>
    ipcRenderer.invoke('db:milestones:suggested', studentId, count),

  // Resources
  getResources: (milestoneId: string) => ipcRenderer.invoke('db:resources:getAll', milestoneId),
  createResource: (data: CreateResource) => ipcRenderer.invoke('db:resources:create', data),
  deleteResource: (id: string) => ipcRenderer.invoke('db:resources:delete', id),
  uploadResourceFile: (milestoneId: string, title: string) =>
    ipcRenderer.invoke('db:resources:uploadFile', milestoneId, title),
  openResource: (resource: MilestoneResource) => ipcRenderer.invoke('resources:open', resource),

  // Weekly Plans
  getWeeklyPlan: (studentId: string, weekStart: string) =>
    ipcRenderer.invoke('db:weeklyPlan:get', studentId, weekStart),
  saveWeeklyPlan: (studentId: string, weekStart: string, milestoneIds: string[]) =>
    ipcRenderer.invoke('db:weeklyPlan:save', studentId, weekStart, milestoneIds),

  // Calendar
  fetchCalendarEvents: (feedUrl: string, startDate: string, endDate: string) =>
    ipcRenderer.invoke('calendar:fetchEvents', feedUrl, startDate, endDate),

  // Books (Library)
  getBooks: () => ipcRenderer.invoke('db:books:getAll'),
  getBook: (id: string) => ipcRenderer.invoke('db:books:get', id),
  createBook: (data: CreateBook) => ipcRenderer.invoke('db:books:create', data),
  updateBook: (id: string, data: UpdateBook) => ipcRenderer.invoke('db:books:update', id, data),
  deleteBook: (id: string) => ipcRenderer.invoke('db:books:delete', id),
  getBooksWithProgress: (studentId: string) => ipcRenderer.invoke('db:books:withProgress', studentId),
  getStudentBook: (studentId: string, bookId: string) =>
    ipcRenderer.invoke('db:studentBooks:get', studentId, bookId),
  updateStudentBook: (studentId: string, bookId: string, data: UpdateStudentBook) =>
    ipcRenderer.invoke('db:studentBooks:update', studentId, bookId, data),
  logReading: (studentId: string, bookId: string, pagesRead: number, notes?: string) =>
    ipcRenderer.invoke('db:books:logReading', studentId, bookId, pagesRead, notes),

  // Field Trips / Activities
  getFieldTrips: (filters?: { studentId?: string; status?: FieldTripStatus; activityType?: EventActivityType }) =>
    ipcRenderer.invoke('db:fieldTrips:getAll', filters),
  getFieldTrip: (id: string) => ipcRenderer.invoke('db:fieldTrips:get', id),
  createFieldTrip: (data: CreateFieldTrip) => ipcRenderer.invoke('db:fieldTrips:create', data),
  updateFieldTrip: (id: string, data: UpdateFieldTrip) =>
    ipcRenderer.invoke('db:fieldTrips:update', id, data),
  deleteFieldTrip: (id: string) => ipcRenderer.invoke('db:fieldTrips:delete', id),

  // Activity Tasks
  getActivityTasks: (activityId: string) => ipcRenderer.invoke('db:activityTasks:getAll', activityId),
  createActivityTask: (data: CreateActivityTask) => ipcRenderer.invoke('db:activityTasks:create', data),
  updateActivityTask: (id: string, data: UpdateActivityTask) =>
    ipcRenderer.invoke('db:activityTasks:update', id, data),
  deleteActivityTask: (id: string) => ipcRenderer.invoke('db:activityTasks:delete', id),
  toggleActivityTask: (id: string) => ipcRenderer.invoke('db:activityTasks:toggle', id),

  // Activity Contacts
  getActivityContacts: (activityId: string) => ipcRenderer.invoke('db:activityContacts:getAll', activityId),
  createActivityContact: (data: CreateActivityContact) => ipcRenderer.invoke('db:activityContacts:create', data),
  updateActivityContact: (id: string, data: UpdateActivityContact) =>
    ipcRenderer.invoke('db:activityContacts:update', id, data),
  deleteActivityContact: (id: string) => ipcRenderer.invoke('db:activityContacts:delete', id),

  // Activity RSVPs
  getActivityRSVPs: (activityId: string) => ipcRenderer.invoke('db:activityRSVPs:getAll', activityId),
  createActivityRSVP: (data: CreateActivityRSVP) => ipcRenderer.invoke('db:activityRSVPs:create', data),
  updateActivityRSVP: (id: string, data: UpdateActivityRSVP) =>
    ipcRenderer.invoke('db:activityRSVPs:update', id, data),
  deleteActivityRSVP: (id: string) => ipcRenderer.invoke('db:activityRSVPs:delete', id),

  // Activity Expenses
  getActivityExpenses: (activityId: string) => ipcRenderer.invoke('db:activityExpenses:getAll', activityId),
  createActivityExpense: (data: CreateActivityExpense) => ipcRenderer.invoke('db:activityExpenses:create', data),
  updateActivityExpense: (id: string, data: UpdateActivityExpense) =>
    ipcRenderer.invoke('db:activityExpenses:update', id, data),
  deleteActivityExpense: (id: string) => ipcRenderer.invoke('db:activityExpenses:delete', id),

  // Activity Payments
  getActivityPayments: (activityId: string) => ipcRenderer.invoke('db:activityPayments:getAll', activityId),
  createActivityPayment: (data: CreateActivityPayment) => ipcRenderer.invoke('db:activityPayments:create', data),
  updateActivityPayment: (id: string, data: UpdateActivityPayment) =>
    ipcRenderer.invoke('db:activityPayments:update', id, data),
  deleteActivityPayment: (id: string) => ipcRenderer.invoke('db:activityPayments:delete', id),

  // Duplicate Activity
  duplicateActivity: (id: string, options: { newDate: string; copyTasks?: boolean; copyContacts?: boolean }) =>
    ipcRenderer.invoke('db:fieldTrips:duplicate', id, options),

  // Google Calendar Auth
  getGoogleAuthStatus: () => ipcRenderer.invoke('google:auth:status') as Promise<{ hasCredentials: boolean; isAuthenticated: boolean }>,
  hasGoogleCredentials: () => ipcRenderer.invoke('google:auth:hasCredentials') as Promise<boolean>,
  saveGoogleCredentials: (credentials: { client_id: string; client_secret: string }) =>
    ipcRenderer.invoke('google:auth:saveCredentials', credentials) as Promise<boolean>,
  connectGoogleCalendar: () => ipcRenderer.invoke('google:auth:connect') as Promise<boolean>,
  disconnectGoogleCalendar: () => ipcRenderer.invoke('google:auth:disconnect') as Promise<boolean>,

  // Google Calendar
  listGoogleCalendars: () => ipcRenderer.invoke('google:calendar:list') as Promise<Array<{ id: string; summary: string; primary?: boolean }>>,
  createGoogleCalendarEvent: (calendarId: string, event: {
    summary: string
    description?: string
    start: string
    end: string
    allDay: boolean
  }) => ipcRenderer.invoke('google:calendar:createEvent', calendarId, event) as Promise<string>,
  updateGoogleCalendarEvent: (calendarId: string, eventId: string, event: {
    summary: string
    description?: string
    start: string
    end: string
    allDay: boolean
  }) => ipcRenderer.invoke('google:calendar:updateEvent', calendarId, eventId, event) as Promise<void>,
  deleteGoogleCalendarEvent: (calendarId: string, eventId: string) =>
    ipcRenderer.invoke('google:calendar:deleteEvent', calendarId, eventId) as Promise<void>,

  // Calendar Sync
  getCalendarSyncRecord: (milestoneId: string, weekStart: string) =>
    ipcRenderer.invoke('calendar:sync:getRecord', milestoneId, weekStart),
  getCalendarSyncRecordsForWeek: (weekStart: string) =>
    ipcRenderer.invoke('calendar:sync:getRecordsForWeek', weekStart),
  upsertCalendarSyncRecord: (milestoneId: string, weekStart: string, googleEventId: string, calendarId: string) =>
    ipcRenderer.invoke('calendar:sync:upsert', milestoneId, weekStart, googleEventId, calendarId),
  deleteCalendarSyncRecord: (milestoneId: string, weekStart: string) =>
    ipcRenderer.invoke('calendar:sync:delete', milestoneId, weekStart),
  deleteCalendarSyncRecordsForWeek: (weekStart: string) =>
    ipcRenderer.invoke('calendar:sync:deleteWeek', weekStart),

  // Skylight Chore Mappings
  getChoreMappings: () => ipcRenderer.invoke('chore:mappings:getAll'),
  getChoreMapping: (subjectId: string) => ipcRenderer.invoke('chore:mapping:get', subjectId),
  upsertChoreMapping: (data: CreateChoreMapping) => ipcRenderer.invoke('chore:mapping:upsert', data),
  deleteChoreMapping: (subjectId: string) => ipcRenderer.invoke('chore:mapping:delete', subjectId),

  // Rewards
  getStudentRewards: (studentId: string, weekStart?: string) =>
    ipcRenderer.invoke('rewards:getForStudent', studentId, weekStart),
  getStudentStarTotals: (studentId: string) => ipcRenderer.invoke('rewards:getStarTotals', studentId),
  createReward: (data: CreateReward) => ipcRenderer.invoke('rewards:create', data),
  markRewardsSynced: (rewardIds: string[]) => ipcRenderer.invoke('rewards:markSynced', rewardIds),

  // Family Goals
  getFamilyGoals: () => ipcRenderer.invoke('familyGoals:getAll'),
  getActiveFamilyGoal: () => ipcRenderer.invoke('familyGoals:getActive'),
  createFamilyGoal: (data: CreateFamilyGoal) => ipcRenderer.invoke('familyGoals:create', data),
  updateFamilyGoal: (id: string, data: UpdateFamilyGoal) =>
    ipcRenderer.invoke('familyGoals:update', id, data),
  deleteFamilyGoal: (id: string) => ipcRenderer.invoke('familyGoals:delete', id),
  achieveFamilyGoal: (id: string) => ipcRenderer.invoke('familyGoals:achieve', id),
  getFamilyTotalStars: () => ipcRenderer.invoke('familyGoals:getTotalStars'),

  // User Settings
  getSetting: (key: string) => ipcRenderer.invoke('settings:get', key) as Promise<string | null>,
  setSetting: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value) as Promise<void>,
  deleteSetting: (key: string) => ipcRenderer.invoke('settings:delete', key) as Promise<void>,

  // Book Scanner
  startScanner: () => ipcRenderer.invoke('scanner:start'),
  stopScanner: () => ipcRenderer.invoke('scanner:stop'),
  getScannerStatus: () => ipcRenderer.invoke('scanner:status'),
  onBookScanned: (callback: (book: Book) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, book: Book) => callback(book)
    ipcRenderer.on('scanner:book-added', handler)
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('scanner:book-added', handler)
    }
  }
}

contextBridge.exposeInMainWorld('api', api)
