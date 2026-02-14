/**
 * Orchestrator: load existing data → scrape all states → merge → validate → write.
 *
 * Merge strategy: scraper updates only the fields it can parse from HSLDA's
 * "At a Glance" section. It preserves existing requiredSubjects, notes,
 * requiredHoursPerYear, resources, etc. Only overwrites fields where the
 * scraper found non-null data.
 */
import { readFile, writeFile, mkdir } from 'fs/promises'
import { resolve, dirname } from 'path'
import { createHash } from 'crypto'
import { STATE_MAP } from './stateMap.js'
import { parseStatePage, type ScrapeResult } from './parseStatePage.js'
import {
  validateStateData,
  validateScrapeResults,
  generateDiff,
  formatDiffReport,
  type StateRequirementsData,
  type StateEntry,
} from './validate.js'

const DELAY_BETWEEN_REQUESTS_MS = 2000
const PROJECT_ROOT = resolve(import.meta.dirname, '../..')
const EXISTING_DATA_PATH = resolve(PROJECT_ROOT, 'apps/desktop/src/data/stateRequirements.json')
const DESKTOP_OUTPUT_PATH = resolve(PROJECT_ROOT, 'apps/desktop/src/data/stateRequirements.json')
const DOCS_DATA_DIR = resolve(PROJECT_ROOT, 'docs/data')
const DOCS_OUTPUT_PATH = resolve(DOCS_DATA_DIR, 'stateRequirements.json')
const DOCS_MANIFEST_PATH = resolve(DOCS_DATA_DIR, 'manifest.json')

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function loadExistingData(): Promise<StateRequirementsData> {
  const raw = await readFile(EXISTING_DATA_PATH, 'utf-8')
  return JSON.parse(raw) as StateRequirementsData
}

function mergeScrapedData(
  existing: StateRequirementsData,
  results: ScrapeResult[],
): StateRequirementsData {
  // Deep clone existing data
  const merged: StateRequirementsData = JSON.parse(JSON.stringify(existing))

  for (const result of results) {
    if (!result.success || !result.data) continue

    const existingState = merged.states[result.stateCode]
    if (!existingState) continue

    const scraped = result.data

    // Only overwrite fields where scraper found non-null data
    if (scraped.requiresNotification !== null) {
      existingState.requiresNotification = scraped.requiresNotification
    }
    if (scraped.assessmentRequired !== null) {
      existingState.assessmentRequired = scraped.assessmentRequired
    }
    if (scraped.parentQualifications !== null) {
      existingState.parentQualifications = scraped.parentQualifications
    }
    if (scraped.regulationLevel !== null) {
      existingState.regulationLevel = scraped.regulationLevel
    }

    // Append compulsory age note if not already present
    if (scraped.compulsoryAgeNote && !existingState.notes.includes('Compulsory ages')) {
      existingState.notes = existingState.notes.trim()
      if (existingState.notes.length > 0 && !existingState.notes.endsWith('.')) {
        existingState.notes += '.'
      }
      existingState.notes += ` ${scraped.compulsoryAgeNote}`
    }
  }

  // Rebuild regulationLevels index from state data
  merged.regulationLevels = rebuildRegulationLevels(merged.states)

  return merged
}

function rebuildRegulationLevels(
  states: Record<string, StateEntry>,
): Record<string, { description: string; states: string[] }> {
  const descriptions: Record<string, string> = {
    minimal: 'No notification required, few or no requirements',
    low: 'Low regulation per HSLDA',
    moderate: 'Notification required, some testing or record-keeping',
    high: 'Notification, testing, and detailed record-keeping required',
  }

  const levels: Record<string, { description: string; states: string[] }> = {}
  for (const [level, description] of Object.entries(descriptions)) {
    levels[level] = { description, states: [] }
  }

  for (const [code, state] of Object.entries(states)) {
    const level = state.regulationLevel
    if (levels[level]) {
      levels[level].states.push(code)
    }
  }

  return levels
}

function computeContentHash(data: StateRequirementsData): string {
  const json = JSON.stringify(data, null, 2)
  return 'sha256:' + createHash('sha256').update(json).digest('hex')
}

async function writeOutput(
  data: StateRequirementsData,
  existingData: StateRequirementsData,
): Promise<void> {
  const json = JSON.stringify(data, null, 2) + '\n'

  // Write to desktop app bundled copy
  await writeFile(DESKTOP_OUTPUT_PATH, json, 'utf-8')
  console.log(`[Scraper] Wrote ${DESKTOP_OUTPUT_PATH}`)

  // Write to docs/data/ for OTA
  await mkdir(DOCS_DATA_DIR, { recursive: true })
  await writeFile(DOCS_OUTPUT_PATH, json, 'utf-8')
  console.log(`[Scraper] Wrote ${DOCS_OUTPUT_PATH}`)

  // Write manifest
  const manifest = {
    schemaVersion: 1,
    dataVersion: new Date().toISOString(),
    contentHash: computeContentHash(data),
    stateCount: Object.keys(data.states).length,
  }
  await writeFile(DOCS_MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf-8')
  console.log(`[Scraper] Wrote ${DOCS_MANIFEST_PATH}`)

  // Print diff report
  const diffs = generateDiff(existingData, data)
  console.log('\n' + formatDiffReport(diffs))
}

async function main(): Promise<void> {
  console.log('[Scraper] Loading existing state requirements data...')
  const existingData = await loadExistingData()

  const stateCodes = Object.keys(STATE_MAP)
  console.log(`[Scraper] Scraping ${stateCodes.length} states from HSLDA...`)

  const results: ScrapeResult[] = []

  for (let i = 0; i < stateCodes.length; i++) {
    const code = stateCodes[i]
    const { slug } = STATE_MAP[code]

    console.log(`[Scraper] (${i + 1}/${stateCodes.length}) Scraping ${code} (${slug})...`)
    const result = await parseStatePage(code, slug)
    results.push(result)

    if (result.success) {
      console.log(`[Scraper]   OK: notification=${result.data?.requiresNotification}, assessment=${result.data?.assessmentRequired}, regulation=${result.data?.regulationLevel}`)
    } else {
      console.error(`[Scraper]   FAILED: ${result.error}`)
    }

    // Delay between requests (skip after last)
    if (i < stateCodes.length - 1) {
      await sleep(DELAY_BETWEEN_REQUESTS_MS)
    }
  }

  // Validate scrape results
  console.log('\n[Scraper] Validating scrape results...')
  const scrapeValidation = validateScrapeResults(results, stateCodes.length)
  if (scrapeValidation.warnings.length > 0) {
    for (const warning of scrapeValidation.warnings) {
      console.warn(`[Scraper] WARNING: ${warning}`)
    }
  }
  if (!scrapeValidation.isValid) {
    for (const error of scrapeValidation.errors) {
      console.error(`[Scraper] ERROR: ${error}`)
    }
    process.exit(1)
  }

  // Merge scraped data into existing
  console.log('[Scraper] Merging scraped data...')
  const mergedData = mergeScrapedData(existingData, results)

  // Validate merged data
  const dataValidation = validateStateData(mergedData)
  if (dataValidation.warnings.length > 0) {
    for (const warning of dataValidation.warnings) {
      console.warn(`[Scraper] WARNING: ${warning}`)
    }
  }
  if (!dataValidation.isValid) {
    for (const error of dataValidation.errors) {
      console.error(`[Scraper] ERROR: ${error}`)
    }
    process.exit(1)
  }

  // Write output
  await writeOutput(mergedData, existingData)

  const successCount = results.filter(r => r.success).length
  console.log(`\n[Scraper] Done. ${successCount}/${stateCodes.length} states scraped successfully.`)
}

main().catch((error) => {
  console.error('[Scraper] Fatal error:', error)
  process.exit(1)
})
