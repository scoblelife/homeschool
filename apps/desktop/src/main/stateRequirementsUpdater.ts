/**
 * OTA updater for state requirements data.
 *
 * On app launch (non-blocking background task):
 * 1. Load cached data from {userData}/state-requirements/
 * 2. If not found → use bundled data
 * 3. Fetch manifest from homeschool.scoble.life/data/manifest.json (5s timeout)
 * 4. Compare contentHash with cached manifest
 * 5. If different → download full JSON → validate → write to cache
 *
 * Throttle: Skip if last check was < 24 hours ago.
 * Fault tolerance: Any failure → silently use cached/bundled.
 */
import { app, BrowserWindow } from 'electron'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { net } from 'electron'

const TAG = '[StateRequirementsUpdater]'
const OTA_BASE_URL = 'https://homeschool.scoble.life/data'
const MANIFEST_URL = `${OTA_BASE_URL}/manifest.json`
const DATA_URL = `${OTA_BASE_URL}/stateRequirements.json`
const FETCH_TIMEOUT_MS = 5000
const THROTTLE_HOURS = 24

interface OTAManifest {
  schemaVersion: number
  dataVersion: string
  contentHash: string
  stateCount: number
}

interface CachedManifest extends OTAManifest {
  lastCheckedAt: string
}

interface StateRequirementsData {
  states: Record<string, unknown>
  regulationLevels: Record<string, unknown>
  commonSubjects: unknown[]
}

function getCacheDir(): string {
  return join(app.getPath('userData'), 'state-requirements')
}

function getCachedDataPath(): string {
  return join(getCacheDir(), 'stateRequirements.json')
}

function getCachedManifestPath(): string {
  return join(getCacheDir(), 'manifest.json')
}

async function readCachedManifest(): Promise<CachedManifest | null> {
  try {
    const raw = await readFile(getCachedManifestPath(), 'utf-8')
    return JSON.parse(raw) as CachedManifest
  } catch {
    return null
  }
}

async function readCachedData(): Promise<StateRequirementsData | null> {
  try {
    const raw = await readFile(getCachedDataPath(), 'utf-8')
    return JSON.parse(raw) as StateRequirementsData
  } catch {
    return null
  }
}

function loadBundledData(): StateRequirementsData {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('../../data/stateRequirements.json') as StateRequirementsData
}

function isThrottled(manifest: CachedManifest): boolean {
  if (!manifest.lastCheckedAt) return false
  const lastChecked = new Date(manifest.lastCheckedAt).getTime()
  const now = Date.now()
  const hoursElapsed = (now - lastChecked) / (1000 * 60 * 60)
  return hoursElapsed < THROTTLE_HOURS
}

function validateData(data: unknown): data is StateRequirementsData {
  if (!data || typeof data !== 'object') return false
  const typed = data as Record<string, unknown>
  if (!typed.states || typeof typed.states !== 'object') return false
  if (!typed.regulationLevels || typeof typed.regulationLevels !== 'object') return false
  if (!Array.isArray(typed.commonSubjects)) return false

  const stateCount = Object.keys(typed.states as Record<string, unknown>).length
  if (stateCount < 8) return false

  return true
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = net.request(url)
    let data = ''
    let settled = false

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true
        request.abort()
        reject(new Error(`Fetch timed out after ${timeoutMs}ms`))
      }
    }, timeoutMs)

    request.on('response', (response) => {
      if (response.statusCode !== 200) {
        clearTimeout(timer)
        settled = true
        reject(new Error(`HTTP ${response.statusCode}`))
        return
      }
      response.on('data', (chunk) => {
        data += chunk.toString()
      })
      response.on('end', () => {
        if (!settled) {
          clearTimeout(timer)
          settled = true
          resolve(data)
        }
      })
    })

    request.on('error', (error) => {
      if (!settled) {
        clearTimeout(timer)
        settled = true
        reject(error)
      }
    })

    request.end()
  })
}

function notifyRenderer(): void {
  const windows = BrowserWindow.getAllWindows()
  for (const window of windows) {
    window.webContents.send('stateRequirements:updated')
  }
}

/** Current data: OTA cached > bundled fallback */
let currentData: StateRequirementsData | null = null
let currentSource: 'bundled' | 'cached' | 'ota' = 'bundled'
let lastCheckedAt: string | null = null
let dataVersion: string | null = null

export function getCurrentData(): StateRequirementsData {
  if (currentData) return currentData
  currentData = loadBundledData()
  currentSource = 'bundled'
  return currentData
}

export function getUpdateStatus(): {
  lastChecked: string | null
  dataVersion: string | null
  source: string
} {
  return { lastChecked: lastCheckedAt, dataVersion, source: currentSource }
}

export async function checkForUpdate(): Promise<boolean> {
  try {
    const manifestRaw = await fetchWithTimeout(MANIFEST_URL, FETCH_TIMEOUT_MS)
    const remoteManifest = JSON.parse(manifestRaw) as OTAManifest

    const cachedManifest = await readCachedManifest()

    if (cachedManifest && cachedManifest.contentHash === remoteManifest.contentHash) {
      // Update lastCheckedAt even if no new data
      const updatedManifest: CachedManifest = {
        ...cachedManifest,
        lastCheckedAt: new Date().toISOString(),
      }
      await mkdir(getCacheDir(), { recursive: true })
      await writeFile(getCachedManifestPath(), JSON.stringify(updatedManifest, null, 2), 'utf-8')
      lastCheckedAt = updatedManifest.lastCheckedAt
      return false
    }

    // Download new data
    const dataRaw = await fetchWithTimeout(DATA_URL, FETCH_TIMEOUT_MS)
    const newData = JSON.parse(dataRaw) as unknown

    if (!validateData(newData)) {
      console.warn(`${TAG} Downloaded data failed validation, skipping update`)
      return false
    }

    // Write to cache
    await mkdir(getCacheDir(), { recursive: true })
    await writeFile(getCachedDataPath(), dataRaw, 'utf-8')

    const updatedManifest: CachedManifest = {
      ...remoteManifest,
      lastCheckedAt: new Date().toISOString(),
    }
    await writeFile(getCachedManifestPath(), JSON.stringify(updatedManifest, null, 2), 'utf-8')

    // Update in-memory state
    currentData = newData
    currentSource = 'ota'
    lastCheckedAt = updatedManifest.lastCheckedAt
    dataVersion = remoteManifest.dataVersion

    console.log(`${TAG} Updated to version ${remoteManifest.dataVersion}`)
    notifyRenderer()
    return true
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`${TAG} Update check failed: ${message}`)
    return false
  }
}

/**
 * Initialize on app launch. Non-blocking — runs in background.
 */
export async function initStateRequirementsUpdater(): Promise<void> {
  try {
    // Try to load cached data first
    const cached = await readCachedData()
    if (cached && validateData(cached)) {
      currentData = cached
      currentSource = 'cached'
      console.log(`${TAG} Loaded cached data`)
    } else {
      currentData = loadBundledData()
      currentSource = 'bundled'
      console.log(`${TAG} Using bundled data`)
    }

    // Load cached manifest for throttle check
    const cachedManifest = await readCachedManifest()
    if (cachedManifest) {
      lastCheckedAt = cachedManifest.lastCheckedAt || null
      dataVersion = cachedManifest.dataVersion || null
    }

    // Check if throttled
    if (cachedManifest && isThrottled(cachedManifest)) {
      console.log(`${TAG} Skipping update check (last checked ${cachedManifest.lastCheckedAt})`)
      return
    }

    // Background update check — do not await in caller
    checkForUpdate().catch((error) => {
      const message = error instanceof Error ? error.message : String(error)
      console.warn(`${TAG} Background update check failed: ${message}`)
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`${TAG} Initialization failed, using bundled data: ${message}`)
    currentData = loadBundledData()
    currentSource = 'bundled'
  }
}
