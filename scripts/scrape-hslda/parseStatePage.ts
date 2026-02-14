/**
 * Fetch and parse one state's HSLDA "At a Glance" section via cheerio.
 *
 * Extracts: requiresNotification, assessmentRequired, parentQualifications,
 * regulationLevel, and compulsory age range (appended to notes).
 */
import * as cheerio from 'cheerio'
import { getStateUrl } from './stateMap.js'

export interface ScrapedStateData {
  requiresNotification: boolean | null
  assessmentRequired: boolean | null
  parentQualifications: string | null
  regulationLevel: string | null
  compulsoryAgeNote: string | null
}

export interface ScrapeResult {
  stateCode: string
  success: boolean
  data: ScrapedStateData | null
  error: string | null
}

function parseYesNo(text: string): boolean | null {
  const normalized = text.trim().toLowerCase()
  if (normalized.startsWith('yes')) return true
  if (normalized.startsWith('no')) return false
  return null
}

function extractQualification(text: string): string | null {
  const normalized = text.trim().toLowerCase()
  if (normalized.startsWith('no')) return null
  if (normalized.startsWith('yes')) {
    // Return the full text as qualifier
    return text.trim()
  }
  return text.trim() || null
}

function extractRegulationLevel(html: string): string | null {
  // HSLDA uses a regulation bar with indicators. Look for common patterns.
  const $ = cheerio.load(html)

  // Check for explicit regulation level text
  const regulationPatterns = [
    { pattern: /no\s*regulation/i, level: 'minimal' },
    { pattern: /low\s*regulation/i, level: 'low' },
    { pattern: /moderate\s*regulation/i, level: 'moderate' },
    { pattern: /high\s*regulation/i, level: 'high' },
  ]

  const bodyText = $('body').text()
  for (const { pattern, level } of regulationPatterns) {
    if (pattern.test(bodyText)) return level
  }

  return null
}

function extractCompulsoryAge(text: string): string | null {
  // Look for patterns like "Compulsory ages 6-18" or "ages 6 through 18"
  const agePattern = /compulsory\s+(?:school\s+)?ages?\s+(\d+)\s*[-–to]+\s*(\d+)/i
  const match = text.match(agePattern)
  if (match) {
    return `Compulsory ages ${match[1]}-${match[2]}.`
  }
  return null
}

export async function parseStatePage(stateCode: string, slug: string): Promise<ScrapeResult> {
  const url = getStateUrl(slug)

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'HomeschoolApp-DataUpdater/1.0 (educational; non-commercial)',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      return {
        stateCode,
        success: false,
        data: null,
        error: `HTTP ${response.status} for ${url}`,
      }
    }

    const html = await response.text()
    const $ = cheerio.load(html)
    const bodyText = $('body').text()

    // Extract from "At a Glance" section or summary tables
    let requiresNotification: boolean | null = null
    let assessmentRequired: boolean | null = null
    let parentQualifications: string | null = null

    // Look for "At a Glance" or summary list items
    const glanceSection = $('.at-a-glance, .summary, .quick-facts, [class*="glance"], [class*="summary"]')
    const searchText = glanceSection.length > 0 ? glanceSection.text() : bodyText

    // Notification
    const notificationMatch = searchText.match(/notification[^.]*?(required|not required|yes|no)/i)
    if (notificationMatch) {
      const value = notificationMatch[1].toLowerCase()
      requiresNotification = value === 'required' || value === 'yes'
    }

    // Assessment
    const assessmentMatch = searchText.match(/assessment[^.]*?(required|not required|yes|no)/i)
    if (assessmentMatch) {
      const value = assessmentMatch[1].toLowerCase()
      assessmentRequired = value === 'required' || value === 'yes'
    }

    // Look through table rows and list items for structured data
    $('tr, li, dt, dd').each((_, element) => {
      const text = $(element).text().trim()

      if (/notification/i.test(text)) {
        const parsed = parseYesNo(text.replace(/.*notification[:\s]*/i, ''))
        if (parsed !== null) requiresNotification = parsed
      }

      if (/assessment/i.test(text) && !/self.assessment/i.test(text)) {
        const parsed = parseYesNo(text.replace(/.*assessment[:\s]*/i, ''))
        if (parsed !== null) assessmentRequired = parsed
      }

      if (/teacher\s*qual|parent\s*qual/i.test(text)) {
        const qual = extractQualification(text.replace(/.*(?:teacher|parent)\s*qual\w*[:\s]*/i, ''))
        if (qual !== null) parentQualifications = qual
      }
    })

    const regulationLevel = extractRegulationLevel(html)
    const compulsoryAgeNote = extractCompulsoryAge(bodyText)

    return {
      stateCode,
      success: true,
      data: {
        requiresNotification,
        assessmentRequired,
        parentQualifications,
        regulationLevel,
        compulsoryAgeNote,
      },
      error: null,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      stateCode,
      success: false,
      data: null,
      error: message,
    }
  }
}
