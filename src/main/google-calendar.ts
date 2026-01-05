import { google, calendar_v3 } from 'googleapis'
import { getAuthenticatedClient } from './google-auth'

export interface CalendarInfo {
  id: string
  summary: string
  primary?: boolean
}

export interface CalendarEvent {
  id?: string
  summary: string
  description?: string
  start: string // ISO date or datetime
  end: string // ISO date or datetime
  allDay: boolean
}

/**
 * Get Google Calendar API instance
 */
function getCalendarApi(): calendar_v3.Calendar | null {
  const auth = getAuthenticatedClient()
  if (!auth) return null
  return google.calendar({ version: 'v3', auth })
}

/**
 * List user's calendars
 */
export async function listCalendars(): Promise<CalendarInfo[]> {
  const calendar = getCalendarApi()
  if (!calendar) throw new Error('Not authenticated')

  const response = await calendar.calendarList.list()
  const items = response.data.items || []

  return items
    .filter((item) => item.accessRole === 'owner' || item.accessRole === 'writer')
    .map((item) => ({
      id: item.id!,
      summary: item.summary || 'Unnamed Calendar',
      primary: item.primary || false
    }))
}

/**
 * Create a calendar event
 */
export async function createEvent(
  calendarId: string,
  event: CalendarEvent
): Promise<string> {
  const calendar = getCalendarApi()
  if (!calendar) throw new Error('Not authenticated')

  const eventBody: calendar_v3.Schema$Event = {
    summary: event.summary,
    description: event.description
  }

  if (event.allDay) {
    // All-day events use date (not dateTime)
    eventBody.start = { date: event.start.split('T')[0] }
    eventBody.end = { date: event.end.split('T')[0] }
  } else {
    // Timed events use dateTime
    eventBody.start = { dateTime: event.start, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
    eventBody.end = { dateTime: event.end, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
  }

  const response = await calendar.events.insert({
    calendarId,
    requestBody: eventBody
  })

  return response.data.id!
}

/**
 * Update an existing calendar event
 */
export async function updateEvent(
  calendarId: string,
  eventId: string,
  event: CalendarEvent
): Promise<void> {
  const calendar = getCalendarApi()
  if (!calendar) throw new Error('Not authenticated')

  const eventBody: calendar_v3.Schema$Event = {
    summary: event.summary,
    description: event.description
  }

  if (event.allDay) {
    eventBody.start = { date: event.start.split('T')[0] }
    eventBody.end = { date: event.end.split('T')[0] }
  } else {
    eventBody.start = { dateTime: event.start, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
    eventBody.end = { dateTime: event.end, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
  }

  await calendar.events.update({
    calendarId,
    eventId,
    requestBody: eventBody
  })
}

/**
 * Delete a calendar event
 */
export async function deleteEvent(calendarId: string, eventId: string): Promise<void> {
  const calendar = getCalendarApi()
  if (!calendar) throw new Error('Not authenticated')

  try {
    await calendar.events.delete({
      calendarId,
      eventId
    })
  } catch (error: unknown) {
    // Ignore 404 errors (event already deleted)
    if (error && typeof error === 'object' && 'code' in error && (error as { code: number }).code !== 404) {
      throw error
    }
  }
}

/**
 * Get a single event
 */
export async function getEvent(
  calendarId: string,
  eventId: string
): Promise<CalendarEvent | null> {
  const calendar = getCalendarApi()
  if (!calendar) throw new Error('Not authenticated')

  try {
    const response = await calendar.events.get({
      calendarId,
      eventId
    })

    const event = response.data
    const isAllDay = !!event.start?.date

    return {
      id: event.id!,
      summary: event.summary || '',
      description: event.description || undefined,
      start: event.start?.date || event.start?.dateTime || '',
      end: event.end?.date || event.end?.dateTime || '',
      allDay: isAllDay
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: number }).code === 404) {
      return null
    }
    throw error
  }
}
