import { ipcMain, dialog, shell, app, net, BrowserWindow } from 'electron'
import { copyFile, mkdir, writeFile, unlink, stat } from 'fs/promises'
import { join, basename, extname } from 'path'
import { nativeImage } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import {
  studentsRepo,
  subjectsRepo,
  sessionsRepo,
  activitiesRepo,
  reportsRepo,
  milestonesRepo,
  resourcesRepo,
  booksRepo,
  fieldTripsRepo,
  calendarSyncRepo,
  rewardsRepo,
  familyGoalsRepo,
  recurringRepo,
  attachmentsRepo,
  attendanceRepo,
  curriculumRepo,
  coopRepo,
  packagesRepo,
  assessmentsRepo,
  umbrellaRepo,
  sponsoredRepo
} from '../database'
import * as googleAuth from './google-auth'
import * as googleCalendar from './google-calendar'
import { bookScanner } from './book-scanner'
import type {
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
  CalendarBusyEvent,
  CreateBook,
  UpdateBook,
  UpdateStudentBook,
  CreateFieldTrip,
  UpdateFieldTrip,
  UniversalStatus,
  EventCategory,
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
  CreateReward,
  CreateFamilyGoal,
  UpdateFamilyGoal,
  ScannedBook,
  CreateRecurringActivity,
  UpdateRecurringActivity,
  CreateAttendanceRecord,
  PortfolioConfig,
  CreateCustomStandard,
  UpdateCustomStandard,
  CreateCoopGroup,
  UpdateCoopGroup,
  CreateCoopMember,
  UpdateCoopMember,
  CreateCoopEvent,
  UpdateCoopEvent,
  UpdateCoopSharingPreferences,
  CreateSharedResource,
  UpdateSharedResource,
  CreateResourceRating,
  CreateMentorProfile,
  UpdateMentorProfile,
  CreateMentorRequest,
  MentorRequestStatus,
  CreateCurriculumPackage,
  UpdateCurriculumPackage,
  CreateAssessment,
  UpdateAssessment,
  CreateUmbrellaSchool,
  UpdateUmbrellaSchool,
  CreateUmbrellaSchoolEnrollment,
  UpdateUmbrellaSchoolEnrollment,
  CreateUmbrellaSchoolReport,
  UpdateUmbrellaSchoolReport
} from '../shared/types'

// Simple iCal parser for extracting events
function parseICalEvents(icalData: string, startDate: string, endDate: string): CalendarBusyEvent[] {
  const events: CalendarBusyEvent[] = []
  const startMs = new Date(startDate).getTime()
  const endMs = new Date(endDate + 'T23:59:59').getTime()

  // Split by VEVENT blocks
  const eventBlocks = icalData.split('BEGIN:VEVENT')

  for (let i = 1; i < eventBlocks.length; i++) {
    const block = eventBlocks[i].split('END:VEVENT')[0]

    // Extract DTSTART
    const dtStartMatch = block.match(/DTSTART[^:]*:(\d{8}(?:T\d{6}Z?)?)/)
    // Extract DTEND
    const dtEndMatch = block.match(/DTEND[^:]*:(\d{8}(?:T\d{6}Z?)?)/)
    // Extract SUMMARY
    const summaryMatch = block.match(/SUMMARY:(.+?)(?:\r?\n|$)/)

    if (dtStartMatch) {
      const startStr = dtStartMatch[1]
      const endStr = dtEndMatch ? dtEndMatch[1] : startStr

      // Parse date (format: YYYYMMDD or YYYYMMDDTHHMMSSZ)
      const parseICalDate = (str: string): Date => {
        if (str.length === 8) {
          // Date only: YYYYMMDD
          return new Date(`${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`)
        } else {
          // DateTime: YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
          const date = `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`
          const time = `${str.slice(9, 11)}:${str.slice(11, 13)}:${str.slice(13, 15)}`
          return new Date(`${date}T${time}Z`)
        }
      }

      const eventStart = parseICalDate(startStr)
      const eventEnd = parseICalDate(endStr)

      // Check if event falls within our date range
      if (eventEnd.getTime() >= startMs && eventStart.getTime() <= endMs) {
        events.push({
          start: eventStart.toISOString().split('T')[0],
          end: eventEnd.toISOString().split('T')[0],
          summary: summaryMatch ? summaryMatch[1].trim() : undefined
        })
      }
    }
  }

  return events
}

// Fetch iCal feed
async function fetchICalFeed(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = net.request(url)

    let data = ''

    request.on('response', (response) => {
      response.on('data', (chunk) => {
        data += chunk.toString()
      })
      response.on('end', () => {
        resolve(data)
      })
      response.on('error', reject)
    })

    request.on('error', reject)
    request.end()
  })
}

export function registerIpcHandlers(): void {
  // Students
  ipcMain.handle('db:students:getAll', async () => {
    return studentsRepo.getStudents()
  })

  ipcMain.handle('db:students:get', async (_, id: string) => {
    return studentsRepo.getStudent(id)
  })

  ipcMain.handle('db:students:create', async (_, data: CreateStudent) => {
    return studentsRepo.createStudent(data)
  })

  ipcMain.handle('db:students:update', async (_, id: string, data: UpdateStudent) => {
    return studentsRepo.updateStudent(id, data)
  })

  ipcMain.handle('db:students:delete', async (_, id: string) => {
    return studentsRepo.deleteStudent(id)
  })

  // Subjects
  ipcMain.handle('db:subjects:getAll', async () => {
    return subjectsRepo.getSubjects()
  })

  ipcMain.handle('db:subjects:get', async (_, id: string) => {
    return subjectsRepo.getSubject(id)
  })

  // Sessions
  ipcMain.handle(
    'db:sessions:getAll',
    async (_, filters?: { studentId?: string; startDate?: string; endDate?: string }) => {
      return sessionsRepo.getSessions(filters)
    }
  )

  ipcMain.handle('db:sessions:get', async (_, id: string) => {
    return sessionsRepo.getSession(id)
  })

  ipcMain.handle('db:sessions:create', async (_, data: CreateSession) => {
    return sessionsRepo.createSession(data)
  })

  ipcMain.handle('db:sessions:update', async (_, id: string, data: UpdateSession) => {
    return sessionsRepo.updateSession(id, data)
  })

  ipcMain.handle('db:sessions:delete', async (_, id: string) => {
    return sessionsRepo.deleteSession(id)
  })

  // Activities
  ipcMain.handle(
    'db:activities:getAll',
    async (
      _,
      filters?: {
        studentId?: string
        subjectId?: string
        activityType?: ActivityType
        startDate?: string
        endDate?: string
      }
    ) => {
      return activitiesRepo.getActivities(filters)
    }
  )

  ipcMain.handle('db:activities:get', async (_, id: string) => {
    return activitiesRepo.getActivity(id)
  })

  ipcMain.handle('db:activities:create', async (_, data: CreateActivity) => {
    return activitiesRepo.createActivity(data)
  })

  ipcMain.handle('db:activities:update', async (_, id: string, data: UpdateActivity) => {
    return activitiesRepo.updateActivity(id, data)
  })

  ipcMain.handle('db:activities:delete', async (_, id: string) => {
    return activitiesRepo.deleteActivity(id)
  })

  // Reports
  ipcMain.handle(
    'db:reports:activitySummary',
    async (_, studentId: string, startDate: string, endDate: string) => {
      return reportsRepo.getActivitySummary(studentId, startDate, endDate)
    }
  )

  ipcMain.handle(
    'db:reports:dailySummaries',
    async (_, studentId: string, startDate: string, endDate: string) => {
      return reportsRepo.getDailySummaries(studentId, startDate, endDate)
    }
  )

  // Milestone Templates
  ipcMain.handle('db:milestones:templates', async (_, gradeLevel?: GradeLevel) => {
    return milestonesRepo.getMilestoneTemplates(gradeLevel)
  })

  // Milestones
  ipcMain.handle('db:milestones:getAll', async (_, studentId: string) => {
    return milestonesRepo.getMilestones(studentId)
  })

  ipcMain.handle('db:milestones:get', async (_, id: string) => {
    return milestonesRepo.getMilestone(id)
  })

  ipcMain.handle('db:milestones:create', async (_, data: CreateMilestone) => {
    return milestonesRepo.createMilestone(data)
  })

  ipcMain.handle('db:milestones:update', async (_, id: string, data: UpdateMilestone) => {
    return milestonesRepo.updateMilestone(id, data)
  })

  ipcMain.handle('db:milestones:delete', async (_, id: string) => {
    return milestonesRepo.deleteMilestone(id)
  })

  ipcMain.handle(
    'db:milestones:initStudent',
    async (_, studentId: string, gradeLevel: GradeLevel) => {
      return milestonesRepo.initializeStudentMilestones(studentId, gradeLevel)
    }
  )

  ipcMain.handle('db:milestones:suggested', async (_, studentId: string, count: number) => {
    return milestonesRepo.getSuggestedMilestones(studentId, count)
  })

  // Resources
  ipcMain.handle('db:resources:getAll', async (_, milestoneId: string) => {
    return resourcesRepo.getResources(milestoneId)
  })

  ipcMain.handle('db:resources:create', async (_, data: CreateResource) => {
    return resourcesRepo.createResource(data)
  })

  ipcMain.handle('db:resources:delete', async (_, id: string) => {
    return resourcesRepo.deleteResource(id)
  })

  ipcMain.handle('db:resources:uploadFile', async (_, milestoneId: string, title: string) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt'] },
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const sourcePath = result.filePaths[0]
    const fileName = basename(sourcePath)
    const resourcesDir = join(app.getPath('userData'), 'resources')

    // Ensure resources directory exists
    await mkdir(resourcesDir, { recursive: true })

    // Copy file to resources directory with unique name
    const uniqueFileName = `${uuidv4()}-${fileName}`
    const destPath = join(resourcesDir, uniqueFileName)
    await copyFile(sourcePath, destPath)

    // Create resource record
    return resourcesRepo.createResource({
      milestoneId,
      type: 'file',
      title: title || fileName,
      filePath: destPath,
      fileName
    })
  })

  ipcMain.handle('resources:open', async (_, resource: MilestoneResource) => {
    if (resource.type === 'url' && resource.url) {
      await shell.openExternal(resource.url)
    } else if (resource.type === 'file' && resource.filePath) {
      await shell.openPath(resource.filePath)
    }
  })

  // Weekly Plans
  ipcMain.handle('db:weeklyPlan:get', async (_, studentId: string, weekStart: string) => {
    return resourcesRepo.getWeeklyPlan(studentId, weekStart)
  })

  ipcMain.handle(
    'db:weeklyPlan:save',
    async (_, studentId: string, weekStart: string, milestoneIds: string[]) => {
      return resourcesRepo.saveWeeklyPlan(studentId, weekStart, milestoneIds)
    }
  )

  // Calendar - fetch iCal events
  ipcMain.handle(
    'calendar:fetchEvents',
    async (_, feedUrl: string, startDate: string, endDate: string): Promise<CalendarBusyEvent[]> => {
      try {
        const icalData = await fetchICalFeed(feedUrl)
        return parseICalEvents(icalData, startDate, endDate)
      } catch (error) {
        console.error('Failed to fetch calendar events:', error)
        return []
      }
    }
  )

  // Books (Library)
  ipcMain.handle('db:books:getAll', async () => {
    return booksRepo.getBooks()
  })

  ipcMain.handle('db:books:get', async (_, id: string) => {
    return booksRepo.getBook(id)
  })

  ipcMain.handle('db:books:create', async (_, data: CreateBook) => {
    return booksRepo.createBook(data)
  })

  ipcMain.handle('db:books:update', async (_, id: string, data: UpdateBook) => {
    return booksRepo.updateBook(id, data)
  })

  ipcMain.handle('db:books:delete', async (_, id: string) => {
    return booksRepo.deleteBook(id)
  })

  ipcMain.handle('db:books:withProgress', async (_, studentId: string) => {
    return booksRepo.getBooksWithProgress(studentId)
  })

  ipcMain.handle('db:studentBooks:get', async (_, studentId: string, bookId: string) => {
    return booksRepo.getStudentBook(studentId, bookId)
  })

  ipcMain.handle(
    'db:studentBooks:update',
    async (_, studentId: string, bookId: string, data: UpdateStudentBook) => {
      return booksRepo.updateStudentBook(studentId, bookId, data)
    }
  )

  ipcMain.handle(
    'db:books:logReading',
    async (_, studentId: string, bookId: string, pagesRead: number, notes?: string) => {
      return booksRepo.logReading(studentId, bookId, pagesRead, notes)
    }
  )

  // Field Trips
  ipcMain.handle(
    'db:fieldTrips:getAll',
    async (_, filters?: { studentId?: string; status?: UniversalStatus; eventCategory?: EventCategory }) => {
      return fieldTripsRepo.getFieldTrips(filters)
    }
  )

  ipcMain.handle('db:fieldTrips:get', async (_, id: string) => {
    return fieldTripsRepo.getFieldTrip(id)
  })

  ipcMain.handle('db:fieldTrips:create', async (_, data: CreateFieldTrip) => {
    return fieldTripsRepo.createFieldTrip(data)
  })

  ipcMain.handle('db:fieldTrips:update', async (_, id: string, data: UpdateFieldTrip) => {
    return fieldTripsRepo.updateFieldTrip(id, data)
  })

  ipcMain.handle('db:fieldTrips:delete', async (_, id: string) => {
    return fieldTripsRepo.deleteFieldTrip(id)
  })

  // Activity Tasks
  ipcMain.handle('db:activityTasks:getAll', async (_, activityId: string) => {
    return fieldTripsRepo.getActivityTasks(activityId)
  })

  ipcMain.handle('db:activityTasks:create', async (_, data: CreateActivityTask) => {
    return fieldTripsRepo.createActivityTask(data)
  })

  ipcMain.handle('db:activityTasks:update', async (_, id: string, data: UpdateActivityTask) => {
    return fieldTripsRepo.updateActivityTask(id, data)
  })

  ipcMain.handle('db:activityTasks:delete', async (_, id: string) => {
    return fieldTripsRepo.deleteActivityTask(id)
  })

  ipcMain.handle('db:activityTasks:toggle', async (_, id: string) => {
    return fieldTripsRepo.toggleActivityTask(id)
  })

  // Activity Contacts
  ipcMain.handle('db:activityContacts:getAll', async (_, activityId: string) => {
    return fieldTripsRepo.getActivityContacts(activityId)
  })

  ipcMain.handle('db:activityContacts:create', async (_, data: CreateActivityContact) => {
    return fieldTripsRepo.createActivityContact(data)
  })

  ipcMain.handle('db:activityContacts:update', async (_, id: string, data: UpdateActivityContact) => {
    return fieldTripsRepo.updateActivityContact(id, data)
  })

  ipcMain.handle('db:activityContacts:delete', async (_, id: string) => {
    return fieldTripsRepo.deleteActivityContact(id)
  })

  // Activity RSVPs
  ipcMain.handle('db:activityRSVPs:getAll', async (_, activityId: string) => {
    return fieldTripsRepo.getActivityRSVPs(activityId)
  })

  ipcMain.handle('db:activityRSVPs:create', async (_, data: CreateActivityRSVP) => {
    return fieldTripsRepo.createActivityRSVP(data)
  })

  ipcMain.handle('db:activityRSVPs:update', async (_, id: string, data: UpdateActivityRSVP) => {
    return fieldTripsRepo.updateActivityRSVP(id, data)
  })

  ipcMain.handle('db:activityRSVPs:delete', async (_, id: string) => {
    return fieldTripsRepo.deleteActivityRSVP(id)
  })

  // Activity Expenses
  ipcMain.handle('db:activityExpenses:getAll', async (_, activityId: string) => {
    return fieldTripsRepo.getActivityExpenses(activityId)
  })

  ipcMain.handle('db:activityExpenses:create', async (_, data: CreateActivityExpense) => {
    return fieldTripsRepo.createActivityExpense(data)
  })

  ipcMain.handle('db:activityExpenses:update', async (_, id: string, data: UpdateActivityExpense) => {
    return fieldTripsRepo.updateActivityExpense(id, data)
  })

  ipcMain.handle('db:activityExpenses:delete', async (_, id: string) => {
    return fieldTripsRepo.deleteActivityExpense(id)
  })

  // Activity Payments
  ipcMain.handle('db:activityPayments:getAll', async (_, activityId: string) => {
    return fieldTripsRepo.getActivityPayments(activityId)
  })

  ipcMain.handle('db:activityPayments:create', async (_, data: CreateActivityPayment) => {
    return fieldTripsRepo.createActivityPayment(data)
  })

  ipcMain.handle('db:activityPayments:update', async (_, id: string, data: UpdateActivityPayment) => {
    return fieldTripsRepo.updateActivityPayment(id, data)
  })

  ipcMain.handle('db:activityPayments:delete', async (_, id: string) => {
    return fieldTripsRepo.deleteActivityPayment(id)
  })

  // Duplicate Activity
  ipcMain.handle('db:fieldTrips:duplicate', async (_, id: string, options: { newDate: string; copyTasks?: boolean; copyContacts?: boolean }) => {
    return fieldTripsRepo.duplicateActivity(id, options)
  })

  // Field Trip Activity Linking
  ipcMain.handle('db:fieldTrips:linkActivity', async (_, data: { fieldTripId: string; activityId: string }) => {
    return fieldTripsRepo.linkActivityToFieldTrip(data)
  })

  ipcMain.handle('db:fieldTrips:unlinkActivity', async (_, fieldTripId: string, activityId: string) => {
    return fieldTripsRepo.unlinkActivityFromFieldTrip(fieldTripId, activityId)
  })

  ipcMain.handle('db:fieldTrips:getLinkedActivities', async (_, fieldTripId: string) => {
    return fieldTripsRepo.getLinkedActivities(fieldTripId)
  })

  ipcMain.handle('db:fieldTrips:getFieldTripsForActivity', async (_, activityId: string) => {
    return fieldTripsRepo.getFieldTripsForActivity(activityId)
  })

  // Google Calendar Auth
  ipcMain.handle('google:auth:status', async () => {
    return googleAuth.getAuthStatus()
  })

  ipcMain.handle('google:auth:hasCredentials', async () => {
    return googleAuth.hasCredentials()
  })

  ipcMain.handle('google:auth:saveCredentials', async (_, credentials: { client_id: string; client_secret: string }) => {
    googleAuth.saveCredentials(credentials)
    return true
  })

  ipcMain.handle('google:auth:connect', async () => {
    return googleAuth.startAuthFlow()
  })

  ipcMain.handle('google:auth:disconnect', async () => {
    googleAuth.disconnect()
    return true
  })

  // Google Calendar
  ipcMain.handle('google:calendar:list', async () => {
    return googleCalendar.listCalendars()
  })

  ipcMain.handle('google:calendar:createEvent', async (_, calendarId: string, event: {
    summary: string
    description?: string
    start: string
    end: string
    allDay: boolean
  }) => {
    return googleCalendar.createEvent(calendarId, event)
  })

  ipcMain.handle('google:calendar:updateEvent', async (_, calendarId: string, eventId: string, event: {
    summary: string
    description?: string
    start: string
    end: string
    allDay: boolean
  }) => {
    return googleCalendar.updateEvent(calendarId, eventId, event)
  })

  ipcMain.handle('google:calendar:deleteEvent', async (_, calendarId: string, eventId: string) => {
    return googleCalendar.deleteEvent(calendarId, eventId)
  })

  // Calendar Sync
  ipcMain.handle('calendar:sync:getRecord', async (_, milestoneId: string, weekStart: string) => {
    return calendarSyncRepo.getSyncRecord(milestoneId, weekStart)
  })

  ipcMain.handle('calendar:sync:getRecordsForWeek', async (_, weekStart: string) => {
    return calendarSyncRepo.getSyncRecordsForWeek(weekStart)
  })

  ipcMain.handle('calendar:sync:upsert', async (_, milestoneId: string, weekStart: string, googleEventId: string, calendarId: string) => {
    return calendarSyncRepo.upsertSyncRecord(milestoneId, weekStart, googleEventId, calendarId)
  })

  ipcMain.handle('calendar:sync:delete', async (_, milestoneId: string, weekStart: string) => {
    return calendarSyncRepo.deleteSyncRecord(milestoneId, weekStart)
  })

  ipcMain.handle('calendar:sync:deleteWeek', async (_, weekStart: string) => {
    return calendarSyncRepo.deleteSyncRecordsForWeek(weekStart)
  })

  // Rewards
  ipcMain.handle('rewards:getForStudent', async (_, studentId: string, weekStart?: string) => {
    return rewardsRepo.getStudentRewards(studentId, weekStart)
  })

  ipcMain.handle('rewards:getStarTotals', async (_, studentId: string) => {
    return rewardsRepo.getStudentStarTotals(studentId)
  })

  ipcMain.handle('rewards:create', async (_, data: CreateReward) => {
    return rewardsRepo.createReward(data)
  })

  ipcMain.handle('rewards:markSynced', async (_, rewardIds: string[]) => {
    return rewardsRepo.markRewardsSynced(rewardIds)
  })

  // Family Goals
  ipcMain.handle('familyGoals:getAll', async () => {
    return familyGoalsRepo.getFamilyGoals()
  })

  ipcMain.handle('familyGoals:getActive', async () => {
    return familyGoalsRepo.getActiveFamilyGoal()
  })

  ipcMain.handle('familyGoals:create', async (_, data: CreateFamilyGoal) => {
    return familyGoalsRepo.createFamilyGoal(data)
  })

  ipcMain.handle('familyGoals:update', async (_, id: string, data: UpdateFamilyGoal) => {
    return familyGoalsRepo.updateFamilyGoal(id, data)
  })

  ipcMain.handle('familyGoals:delete', async (_, id: string) => {
    return familyGoalsRepo.deleteFamilyGoal(id)
  })

  ipcMain.handle('familyGoals:achieve', async (_, id: string) => {
    return familyGoalsRepo.achieveFamilyGoal(id)
  })

  ipcMain.handle('familyGoals:getTotalStars', async () => {
    return familyGoalsRepo.getFamilyTotalStars()
  })

  // User Settings
  ipcMain.handle('settings:get', async (_, key: string) => {
    return calendarSyncRepo.getSetting(key)
  })

  ipcMain.handle('settings:set', async (_, key: string, value: string) => {
    return calendarSyncRepo.setSetting(key, value)
  })

  ipcMain.handle('settings:delete', async (_, key: string) => {
    return calendarSyncRepo.deleteSetting(key)
  })

  // Book Scanner
  ipcMain.handle('scanner:start', async () => {
    const session = await bookScanner.start()

    // Set up callback to send scanned books to renderer
    bookScanner.onBook(async (book: ScannedBook) => {
      const windows = BrowserWindow.getAllWindows()
      if (windows.length > 0) {
        // Save cover image if provided
        let coverImagePath: string | undefined

        if (book.coverPhoto) {
          // Save base64 photo from phone
          const coversDir = join(app.getPath('userData'), 'book-covers')
          await mkdir(coversDir, { recursive: true })
          const fileName = `${uuidv4()}.jpg`
          const filePath = join(coversDir, fileName)

          // Extract base64 data (remove data:image/jpeg;base64, prefix)
          const base64Data = book.coverPhoto.replace(/^data:image\/\w+;base64,/, '')
          await writeFile(filePath, Buffer.from(base64Data, 'base64'))
          coverImagePath = filePath
        } else if (book.coverUrl) {
          // Download cover from Open Library
          try {
            const coversDir = join(app.getPath('userData'), 'book-covers')
            await mkdir(coversDir, { recursive: true })
            const fileName = `${uuidv4()}.jpg`
            const filePath = join(coversDir, fileName)

            const imageData = await fetchImageAsBuffer(book.coverUrl)
            if (imageData) {
              await writeFile(filePath, imageData)
              coverImagePath = filePath
            }
          } catch (err) {
            console.error('Failed to download cover image:', err)
          }
        }

        // Create the book in the database
        const newBook = await booksRepo.createBook({
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          totalPages: book.totalPages,
          coverImagePath
        })

        // Send to renderer
        windows[0].webContents.send('scanner:book-added', newBook)
      }
    })

    return session
  })

  ipcMain.handle('scanner:stop', async () => {
    bookScanner.stop()
  })

  ipcMain.handle('scanner:status', async () => {
    return bookScanner.getStatus()
  })

  // Recurring Activities
  ipcMain.handle('recurring:getAll', async (_, studentId?: string) => {
    return recurringRepo.getRecurringActivities(studentId)
  })

  ipcMain.handle('recurring:get', async (_, id: string) => {
    return recurringRepo.getRecurringActivity(id)
  })

  ipcMain.handle('recurring:create', async (_, data: CreateRecurringActivity) => {
    return recurringRepo.createRecurringActivity(data)
  })

  ipcMain.handle('recurring:update', async (_, id: string, data: UpdateRecurringActivity) => {
    return recurringRepo.updateRecurringActivity(id, data)
  })

  ipcMain.handle('recurring:delete', async (_, id: string) => {
    return recurringRepo.deleteRecurringActivity(id)
  })

  ipcMain.handle('recurring:getDue', async (_, studentId?: string, date?: string) => {
    return recurringRepo.getDueRecurringActivities(studentId, date)
  })

  ipcMain.handle('recurring:markLogged', async (_, id: string, date: string) => {
    return recurringRepo.markRecurringActivityLogged(id, date)
  })

  // Activity Attachments
  ipcMain.handle('attachments:getForActivity', async (_, activityId: string) => {
    return attachmentsRepo.getAttachments(activityId)
  })

  ipcMain.handle('attachments:get', async (_, id: string) => {
    return attachmentsRepo.getAttachment(id)
  })

  ipcMain.handle('attachments:add', async (_, activityId: string) => {
    // Open file dialog to select image
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'] }
      ]
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const sourcePath = result.filePaths[0]
    const fileName = basename(sourcePath)
    const fileExt = extname(fileName).toLowerCase()
    const fileType = getImageMimeType(fileExt)

    // Create attachments directory
    const attachmentsDir = join(app.getPath('userData'), 'attachments')
    await mkdir(attachmentsDir, { recursive: true })

    // Generate unique filename
    const uniqueFileName = `${uuidv4()}${fileExt}`
    const destPath = join(attachmentsDir, uniqueFileName)

    // Copy file to attachments directory
    await copyFile(sourcePath, destPath)

    // Get file info
    const fileStats = await stat(destPath)
    let width: number | null = null
    let height: number | null = null

    // Try to get image dimensions
    try {
      const image = nativeImage.createFromPath(destPath)
      const size = image.getSize()
      width = size.width
      height = size.height
    } catch {
      // Ignore dimension errors
    }

    // Create attachment record
    const attachment = await attachmentsRepo.createAttachment({
      activityId,
      filePath: destPath,
      fileName,
      fileType,
      fileSize: fileStats.size,
      width,
      height
    })

    // Generate thumbnail asynchronously
    generateThumbnail(attachment.id, destPath).catch(console.error)

    return attachment
  })

  ipcMain.handle('attachments:delete', async (_, id: string) => {
    const attachment = await attachmentsRepo.getAttachment(id)
    if (!attachment) return false

    // Delete files
    try {
      await unlink(attachment.filePath)
      if (attachment.thumbnailPath) {
        await unlink(attachment.thumbnailPath)
      }
    } catch {
      // Ignore file deletion errors
    }

    return attachmentsRepo.deleteAttachment(id)
  })

  ipcMain.handle('attachments:openFile', async (_, filePath: string) => {
    shell.openPath(filePath)
  })

  ipcMain.handle('attachments:getForActivities', async (_, activityIds: string[]) => {
    const map = await attachmentsRepo.getAttachmentsForActivities(activityIds)
    // Convert Map to object for IPC serialization
    const result: Record<string, unknown[]> = {}
    map.forEach((value, key) => {
      result[key] = value
    })
    return result
  })

  // Attendance
  ipcMain.handle(
    'db:attendance:getRecords',
    async (_, studentId: string, startDate: string, endDate: string) => {
      return attendanceRepo.getAttendanceRecords(studentId, startDate, endDate)
    }
  )

  ipcMain.handle('db:attendance:getRecord', async (_, studentId: string, date: string) => {
    return attendanceRepo.getAttendanceRecord(studentId, date)
  })

  ipcMain.handle('db:attendance:set', async (_, data: CreateAttendanceRecord) => {
    return attendanceRepo.setAttendanceRecord(data)
  })

  ipcMain.handle('db:attendance:delete', async (_, studentId: string, date: string) => {
    return attendanceRepo.deleteAttendanceRecord(studentId, date)
  })

  ipcMain.handle(
    'db:attendance:getStats',
    async (_, studentId: string, startDate: string, endDate: string) => {
      return attendanceRepo.getAttendanceStats(studentId, startDate, endDate)
    }
  )

  // Portfolio
  ipcMain.handle('portfolio:generate', async (_, config: PortfolioConfig) => {
    const { generatePortfolioPDF } = await import('../features/portfolio')
    return generatePortfolioPDF(config)
  })

  ipcMain.handle('portfolio:preview', async (_, config: PortfolioConfig) => {
    const { previewPortfolioHTML } = await import('../features/portfolio')
    return previewPortfolioHTML(config)
  })

  ipcMain.handle('portfolio:defaultConfig', async (_, studentId: string, schoolYear: string) => {
    const { getDefaultConfig } = await import('../features/portfolio')
    return getDefaultConfig(studentId, schoolYear)
  })

  ipcMain.handle('portfolio:currentSchoolYear', async () => {
    const { getCurrentSchoolYear } = await import('../features/portfolio')
    return getCurrentSchoolYear()
  })

  ipcMain.handle('portfolio:openFile', async (_, filePath: string) => {
    shell.openPath(filePath)
  })

  // =============== Curriculum Mapping ===============

  ipcMain.handle('curriculum:getAllStandards', async (_, gradeLevel?: GradeLevel) => {
    return curriculumRepo.getAllStandards(gradeLevel)
  })

  ipcMain.handle('curriculum:getStandard', async (_, id: string) => {
    return curriculumRepo.getStandard(id)
  })

  ipcMain.handle('curriculum:createCustomStandard', async (_, data: CreateCustomStandard) => {
    return curriculumRepo.createCustomStandard(data)
  })

  ipcMain.handle('curriculum:updateCustomStandard', async (_, id: string, data: UpdateCustomStandard) => {
    return curriculumRepo.updateCustomStandard(id, data)
  })

  ipcMain.handle('curriculum:deleteCustomStandard', async (_, id: string) => {
    return curriculumRepo.deleteCustomStandard(id)
  })

  ipcMain.handle('curriculum:getActivityStandards', async (_, activityId: string) => {
    return curriculumRepo.getActivityStandards(activityId)
  })

  ipcMain.handle('curriculum:addActivityStandard', async (_, activityId: string, standardId: string) => {
    return curriculumRepo.addActivityStandard(activityId, standardId)
  })

  ipcMain.handle('curriculum:removeActivityStandard', async (_, activityId: string, standardId: string) => {
    return curriculumRepo.removeActivityStandard(activityId, standardId)
  })

  ipcMain.handle('curriculum:setActivityStandards', async (_, activityId: string, standardIds: string[]) => {
    return curriculumRepo.setActivityStandards(activityId, standardIds)
  })

  ipcMain.handle('curriculum:getStandardCoverage', async (_, studentId: string, gradeLevel: GradeLevel, startDate?: string, endDate?: string) => {
    return curriculumRepo.getStandardCoverage(studentId, gradeLevel, startDate, endDate)
  })

  ipcMain.handle('curriculum:getCurriculumReport', async (_, studentId: string, gradeLevel: GradeLevel, startDate?: string, endDate?: string) => {
    return curriculumRepo.getCurriculumReport(studentId, gradeLevel, startDate, endDate)
  })

  // Curriculum Packages
  ipcMain.handle('packages:getAll', async () => {
    return packagesRepo.getCurriculumPackages()
  })

  ipcMain.handle('packages:get', async (_, id: string) => {
    return packagesRepo.getCurriculumPackage(id)
  })

  ipcMain.handle('packages:create', async (_, data: CreateCurriculumPackage) => {
    return packagesRepo.createCurriculumPackage(data)
  })

  ipcMain.handle('packages:update', async (_, id: string, data: UpdateCurriculumPackage) => {
    return packagesRepo.updateCurriculumPackage(id, data)
  })

  ipcMain.handle('packages:delete', async (_, id: string) => {
    return packagesRepo.deleteCurriculumPackage(id)
  })

  // Co-op Groups
  ipcMain.handle('coop:getGroups', async () => {
    return coopRepo.getCoopGroups()
  })

  ipcMain.handle('coop:getGroup', async (_, id: string) => {
    return coopRepo.getCoopGroup(id)
  })

  ipcMain.handle('coop:getGroupByInviteCode', async (_, inviteCode: string) => {
    return coopRepo.getCoopGroupByInviteCode(inviteCode)
  })

  ipcMain.handle('coop:createGroup', async (_, data: CreateCoopGroup) => {
    return coopRepo.createCoopGroup(data)
  })

  ipcMain.handle('coop:updateGroup', async (_, id: string, data: UpdateCoopGroup) => {
    return coopRepo.updateCoopGroup(id, data)
  })

  ipcMain.handle('coop:deleteGroup', async (_, id: string) => {
    return coopRepo.deleteCoopGroup(id)
  })

  ipcMain.handle('coop:regenerateInviteCode', async (_, groupId: string) => {
    return coopRepo.regenerateInviteCode(groupId)
  })

  // Co-op Members
  ipcMain.handle('coop:getMembers', async (_, groupId: string) => {
    return coopRepo.getCoopMembers(groupId)
  })

  ipcMain.handle('coop:getMember', async (_, id: string) => {
    return coopRepo.getCoopMember(id)
  })

  ipcMain.handle('coop:createMember', async (_, data: CreateCoopMember) => {
    return coopRepo.createCoopMember(data)
  })

  ipcMain.handle('coop:updateMember', async (_, id: string, data: UpdateCoopMember) => {
    return coopRepo.updateCoopMember(id, data)
  })

  ipcMain.handle('coop:deleteMember', async (_, id: string) => {
    return coopRepo.deleteCoopMember(id)
  })

  // Co-op Events
  ipcMain.handle('coop:getEvents', async (_, groupId: string) => {
    return coopRepo.getCoopEvents(groupId)
  })

  ipcMain.handle('coop:getAllUpcomingEvents', async () => {
    return coopRepo.getAllUpcomingCoopEvents()
  })

  ipcMain.handle('coop:getEvent', async (_, id: string) => {
    return coopRepo.getCoopEvent(id)
  })

  ipcMain.handle('coop:createEvent', async (_, data: CreateCoopEvent) => {
    return coopRepo.createCoopEvent(data)
  })

  ipcMain.handle('coop:updateEvent', async (_, id: string, data: UpdateCoopEvent) => {
    return coopRepo.updateCoopEvent(id, data)
  })

  ipcMain.handle('coop:deleteEvent', async (_, id: string) => {
    return coopRepo.deleteCoopEvent(id)
  })

  // Co-op Sharing Preferences
  ipcMain.handle('coop:getSharingPreferences', async (_, groupId: string) => {
    return coopRepo.getOrCreateCoopSharingPreferences(groupId)
  })

  ipcMain.handle('coop:updateSharingPreferences', async (_, groupId: string, data: UpdateCoopSharingPreferences) => {
    return coopRepo.updateCoopSharingPreferences(groupId, data)
  })

  // Shared Resources
  ipcMain.handle('resources:getShared', async (_, groupId: string) => {
    return coopRepo.getSharedResources(groupId)
  })

  ipcMain.handle('resources:getAllShared', async () => {
    return coopRepo.getAllSharedResources()
  })

  ipcMain.handle('resources:getSharedResource', async (_, id: string) => {
    return coopRepo.getSharedResource(id)
  })

  ipcMain.handle('resources:createShared', async (_, data: CreateSharedResource) => {
    return coopRepo.createSharedResource(data)
  })

  ipcMain.handle('resources:updateShared', async (_, id: string, data: UpdateSharedResource) => {
    return coopRepo.updateSharedResource(id, data)
  })

  ipcMain.handle('resources:deleteShared', async (_, id: string) => {
    return coopRepo.deleteSharedResource(id)
  })

  ipcMain.handle('resources:getRatings', async (_, resourceId: string) => {
    return coopRepo.getResourceRatings(resourceId)
  })

  ipcMain.handle('resources:createRating', async (_, data: CreateResourceRating) => {
    return coopRepo.createResourceRating(data)
  })

  ipcMain.handle('resources:deleteRating', async (_, id: string) => {
    return coopRepo.deleteResourceRating(id)
  })

  // Mentor Matching
  ipcMain.handle('mentors:getProfiles', async () => {
    return coopRepo.getMentorProfiles()
  })

  ipcMain.handle('mentors:getProfile', async (_, id: string) => {
    return coopRepo.getMentorProfile(id)
  })

  ipcMain.handle('mentors:getMyProfile', async (_, memberId: string) => {
    return coopRepo.getMyMentorProfile(memberId)
  })

  ipcMain.handle('mentors:createProfile', async (_, data: CreateMentorProfile) => {
    return coopRepo.createMentorProfile(data)
  })

  ipcMain.handle('mentors:updateProfile', async (_, id: string, data: UpdateMentorProfile) => {
    return coopRepo.updateMentorProfile(id, data)
  })

  ipcMain.handle('mentors:deleteProfile', async (_, id: string) => {
    return coopRepo.deleteMentorProfile(id)
  })

  ipcMain.handle('mentors:getRequests', async (_, mentorId: string) => {
    return coopRepo.getMentorRequests(mentorId)
  })

  ipcMain.handle('mentors:getMyRequests', async (_, requesterId: string) => {
    return coopRepo.getMyMentorRequests(requesterId)
  })

  ipcMain.handle('mentors:createRequest', async (_, data: CreateMentorRequest) => {
    return coopRepo.createMentorRequest(data)
  })

  ipcMain.handle('mentors:respondToRequest', async (_, id: string, status: MentorRequestStatus, responseMessage?: string) => {
    return coopRepo.respondToMentorRequest(id, status, responseMessage)
  })

  // Assessments
  ipcMain.handle('assessments:getAll', async (_, studentId?: string) => {
    return assessmentsRepo.getAssessments(studentId)
  })

  ipcMain.handle('assessments:get', async (_, id: string) => {
    return assessmentsRepo.getAssessmentById(id)
  })

  ipcMain.handle('assessments:getUpcoming', async (_, studentId?: string) => {
    return assessmentsRepo.getUpcomingAssessments(studentId)
  })

  ipcMain.handle('assessments:getByDateRange', async (_, startDate: string, endDate: string, studentId?: string) => {
    return assessmentsRepo.getAssessmentsByDateRange(startDate, endDate, studentId)
  })

  ipcMain.handle('assessments:create', async (_, data: CreateAssessment) => {
    return assessmentsRepo.createAssessment(data)
  })

  ipcMain.handle('assessments:update', async (_, id: string, data: UpdateAssessment) => {
    return assessmentsRepo.updateAssessment(id, data)
  })

  ipcMain.handle('assessments:delete', async (_, id: string) => {
    return assessmentsRepo.deleteAssessment(id)
  })

  ipcMain.handle('assessments:getStats', async (_, studentId: string, startDate?: string, endDate?: string) => {
    return assessmentsRepo.getAssessmentStats(studentId, startDate, endDate)
  })

  // ============================================================================
  // Umbrella Schools
  // ============================================================================

  ipcMain.handle('umbrella:getSchools', async () => {
    return umbrellaRepo.getUmbrellaSchools()
  })

  ipcMain.handle('umbrella:getSchool', async (_, id: string) => {
    return umbrellaRepo.getUmbrellaSchoolById(id)
  })

  ipcMain.handle('umbrella:createSchool', async (_, data: CreateUmbrellaSchool) => {
    return umbrellaRepo.createUmbrellaSchool(data)
  })

  ipcMain.handle('umbrella:updateSchool', async (_, id: string, data: UpdateUmbrellaSchool) => {
    return umbrellaRepo.updateUmbrellaSchool(id, data)
  })

  ipcMain.handle('umbrella:deleteSchool', async (_, id: string) => {
    return umbrellaRepo.deleteUmbrellaSchool(id)
  })

  // Umbrella School Enrollments

  ipcMain.handle('umbrella:getEnrollments', async (_, schoolId?: string, studentId?: string) => {
    return umbrellaRepo.getEnrollments(schoolId, studentId)
  })

  ipcMain.handle('umbrella:getEnrollment', async (_, id: string) => {
    return umbrellaRepo.getEnrollmentById(id)
  })

  ipcMain.handle('umbrella:createEnrollment', async (_, data: CreateUmbrellaSchoolEnrollment) => {
    return umbrellaRepo.createEnrollment(data)
  })

  ipcMain.handle('umbrella:updateEnrollment', async (_, id: string, data: UpdateUmbrellaSchoolEnrollment) => {
    return umbrellaRepo.updateEnrollment(id, data)
  })

  ipcMain.handle('umbrella:deleteEnrollment', async (_, id: string) => {
    return umbrellaRepo.deleteEnrollment(id)
  })

  // Umbrella School Reports

  ipcMain.handle('umbrella:getReports', async (_, schoolId?: string, studentId?: string) => {
    return umbrellaRepo.getReports(schoolId, studentId)
  })

  ipcMain.handle('umbrella:getReport', async (_, id: string) => {
    return umbrellaRepo.getReportById(id)
  })

  ipcMain.handle('umbrella:getPendingReports', async (_, schoolId?: string) => {
    return umbrellaRepo.getPendingReports(schoolId)
  })

  ipcMain.handle('umbrella:createReport', async (_, data: CreateUmbrellaSchoolReport) => {
    return umbrellaRepo.createReport(data)
  })

  ipcMain.handle('umbrella:updateReport', async (_, id: string, data: UpdateUmbrellaSchoolReport) => {
    return umbrellaRepo.updateReport(id, data)
  })

  ipcMain.handle('umbrella:deleteReport', async (_, id: string) => {
    return umbrellaRepo.deleteReport(id)
  })

  ipcMain.handle('umbrella:markReportSubmitted', async (_, id: string) => {
    return umbrellaRepo.markReportSubmitted(id)
  })

  // ============================================================================
  // Data Export
  // ============================================================================

  ipcMain.handle('data:exportJSON', async () => {
    try {
      const [students, activities, books, assessments] = await Promise.all([
        studentsRepo.getStudents(),
        activitiesRepo.getActivities({}),
        booksRepo.getBooks(),
        assessmentsRepo.getAssessments(),
      ])

      // Collect per-student data
      const milestones = (await Promise.all(
        students.map(s => milestonesRepo.getMilestones(s.id))
      )).flat()

      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        students,
        activities,
        milestones,
        books,
        assessments,
      }

      const { filePath, canceled } = await dialog.showSaveDialog({
        title: 'Export Data',
        defaultPath: `homeschool-export-${new Date().toISOString().split('T')[0]}.json`,
        filters: [{ name: 'JSON', extensions: ['json'] }],
      })

      if (canceled || !filePath) return { success: false, error: 'Cancelled' }

      await writeFile(filePath, JSON.stringify(exportData, null, 2))
      return { success: true, filePath }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('data:exportActivitiesCSV', async () => {
    try {
      const [students, subjects, activities] = await Promise.all([
        studentsRepo.getStudents(),
        subjectsRepo.getSubjects(),
        activitiesRepo.getActivities({}),
      ])

      const studentMap = new Map(students.map(s => [s.id, s.name]))
      const subjectMap = new Map(subjects.map(s => [s.id, s.name]))

      const headers = ['Date', 'Student', 'Subject', 'Type', 'Title', 'Duration (min)', 'Notes', 'Grade', 'Max Grade']
      const rows = activities.map(a => [
        a.dateCompleted,
        studentMap.get(a.studentId) || a.studentId,
        subjectMap.get(a.subjectId) || a.subjectId,
        a.activityType,
        `"${(a.title || '').replace(/"/g, '""')}"`,
        a.durationMinutes?.toString() || '',
        `"${(a.notes || '').replace(/"/g, '""')}"`,
        a.grade?.toString() || '',
        a.maxGrade?.toString() || '',
      ])

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

      const { filePath, canceled } = await dialog.showSaveDialog({
        title: 'Export Activities CSV',
        defaultPath: `activities-${new Date().toISOString().split('T')[0]}.csv`,
        filters: [{ name: 'CSV', extensions: ['csv'] }],
      })

      if (canceled || !filePath) return { success: false, error: 'Cancelled' }

      await writeFile(filePath, csv)
      return { success: true, filePath }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })
}

// Helper to get MIME type from extension
function getImageMimeType(ext: string): string {
  const types: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.heic': 'image/heic'
  }
  return types[ext] || 'image/jpeg'
}

// Generate thumbnail for an attachment
async function generateThumbnail(attachmentId: string, sourcePath: string): Promise<void> {
  try {
    const image = nativeImage.createFromPath(sourcePath)
    if (image.isEmpty()) return

    // Resize to 200px max dimension
    const size = image.getSize()
    const maxDim = 200
    let newWidth = size.width
    let newHeight = size.height

    if (size.width > maxDim || size.height > maxDim) {
      if (size.width > size.height) {
        newWidth = maxDim
        newHeight = Math.round((size.height / size.width) * maxDim)
      } else {
        newHeight = maxDim
        newWidth = Math.round((size.width / size.height) * maxDim)
      }
    }

    const resized = image.resize({ width: newWidth, height: newHeight })
    const thumbnailBuffer = resized.toJPEG(80)

    // Save thumbnail
    const attachmentsDir = join(app.getPath('userData'), 'attachments', 'thumbnails')
    await mkdir(attachmentsDir, { recursive: true })

    const thumbnailPath = join(attachmentsDir, `${attachmentId}.jpg`)
    await writeFile(thumbnailPath, thumbnailBuffer)

    // Update attachment record
    await attachmentsRepo.updateThumbnailPath(attachmentId, thumbnailPath)
  } catch (err) {
    console.error('Failed to generate thumbnail:', err)
  }
}

// ==========================================
// Sponsorship Handlers (Privacy-First)
// ==========================================

// Sponsors
ipcMain.handle('getSponsors', async (_, activeOnly?: boolean) => {
  return sponsoredRepo.getSponsors(activeOnly)
})

ipcMain.handle('getSponsor', async (_, id: string) => {
  return sponsoredRepo.getSponsor(id)
})

ipcMain.handle('createSponsor', async (_, data) => {
  return sponsoredRepo.createSponsor(data)
})

ipcMain.handle('updateSponsor', async (_, id: string, data) => {
  return sponsoredRepo.updateSponsor(id, data)
})

ipcMain.handle('deleteSponsor', async (_, id: string) => {
  return sponsoredRepo.deleteSponsor(id)
})

// Sponsored Resources
ipcMain.handle('getSponsoredResources', async (_, filters?) => {
  return sponsoredRepo.getSponsoredResources(filters)
})

ipcMain.handle('getSponsoredResource', async (_, id: string) => {
  return sponsoredRepo.getSponsoredResource(id)
})

ipcMain.handle('createSponsoredResource', async (_, data) => {
  return sponsoredRepo.createSponsoredResource(data)
})

ipcMain.handle('updateSponsoredResource', async (_, id: string, data) => {
  return sponsoredRepo.updateSponsoredResource(id, data)
})

ipcMain.handle('deleteSponsoredResource', async (_, id: string) => {
  return sponsoredRepo.deleteSponsoredResource(id)
})

// Anonymous Click Tracking (NO PII)
ipcMain.handle('trackSponsoredClick', async (_, data: { sponsoredResourceId: string; location: string }) => {
  return sponsoredRepo.trackSponsoredClick(
    data.sponsoredResourceId,
    data.location as any
  )
})

// Analytics (Admin only)
ipcMain.handle('getSponsorAnalytics', async (_, filters?) => {
  return sponsoredRepo.getSponsorAnalytics(filters)
})

// ==========================================
// Helper Functions
// ==========================================

// Helper to fetch image as buffer
async function fetchImageAsBuffer(url: string): Promise<Buffer | null> {
  return new Promise((resolve) => {
    const request = net.request(url)
    const chunks: Buffer[] = []

    request.on('response', (response) => {
      response.on('data', (chunk) => {
        chunks.push(chunk)
      })
      response.on('end', () => {
        resolve(Buffer.concat(chunks))
      })
      response.on('error', () => {
        resolve(null)
      })
    })

    request.on('error', () => {
      resolve(null)
    })

    request.end()
  })
}
