/**
 * Schema validation and diff reporting for scraped state requirements data.
 */
import type { ScrapeResult } from './parseStatePage.js'

export interface StateRequirementsData {
  states: Record<string, StateEntry>
  regulationLevels: Record<string, { description: string; states: string[] }>
  commonSubjects: Array<{ id: string; name: string; aliases: string[] }>
}

export interface StateEntry {
  name: string
  requiresNotification: boolean
  requiresApproval: boolean
  requiredSubjects: string[] | null
  requiredHoursPerYear: number | null
  requiredDaysPerYear: number | null
  assessmentRequired: boolean
  recordKeepingRequired: boolean
  parentQualifications: string | null
  notes: string
  resources: string[]
  regulationLevel: string
}

const VALID_REGULATION_LEVELS = ['minimal', 'low', 'moderate', 'high']
const STATE_COUNT_MIN = 8

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export function validateStateData(data: unknown): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Data is not an object'], warnings }
  }

  const typedData = data as Record<string, unknown>

  if (!typedData.states || typeof typedData.states !== 'object') {
    errors.push('Missing or invalid "states" field')
    return { isValid: false, errors, warnings }
  }

  const states = typedData.states as Record<string, unknown>
  const stateCount = Object.keys(states).length

  if (stateCount < STATE_COUNT_MIN) {
    errors.push(`Only ${stateCount} states found, minimum is ${STATE_COUNT_MIN}`)
  }

  for (const [code, entry] of Object.entries(states)) {
    if (!entry || typeof entry !== 'object') {
      errors.push(`State ${code}: entry is not an object`)
      continue
    }

    const state = entry as Record<string, unknown>

    if (typeof state.name !== 'string' || state.name.length === 0) {
      errors.push(`State ${code}: missing name`)
    }

    if (typeof state.requiresNotification !== 'boolean') {
      errors.push(`State ${code}: requiresNotification must be boolean`)
    }

    if (typeof state.assessmentRequired !== 'boolean') {
      errors.push(`State ${code}: assessmentRequired must be boolean`)
    }

    if (typeof state.regulationLevel !== 'string') {
      errors.push(`State ${code}: missing regulationLevel`)
    } else if (!VALID_REGULATION_LEVELS.includes(state.regulationLevel as string)) {
      errors.push(`State ${code}: invalid regulationLevel "${state.regulationLevel}"`)
    }

    if (typeof state.notes !== 'string') {
      warnings.push(`State ${code}: notes is not a string`)
    }
  }

  if (!typedData.regulationLevels || typeof typedData.regulationLevels !== 'object') {
    errors.push('Missing or invalid "regulationLevels" field')
  }

  if (!Array.isArray(typedData.commonSubjects)) {
    errors.push('Missing or invalid "commonSubjects" field')
  }

  return { isValid: errors.length === 0, errors, warnings }
}

export interface DiffEntry {
  stateCode: string
  field: string
  oldValue: unknown
  newValue: unknown
}

export function generateDiff(
  existing: StateRequirementsData,
  updated: StateRequirementsData,
): DiffEntry[] {
  const diffs: DiffEntry[] = []

  for (const [code, updatedState] of Object.entries(updated.states)) {
    const existingState = existing.states[code]
    if (!existingState) {
      diffs.push({ stateCode: code, field: '(new state)', oldValue: null, newValue: updatedState.name })
      continue
    }

    const fieldsToCompare: Array<keyof StateEntry> = [
      'requiresNotification',
      'assessmentRequired',
      'parentQualifications',
      'regulationLevel',
      'notes',
    ]

    for (const field of fieldsToCompare) {
      if (JSON.stringify(existingState[field]) !== JSON.stringify(updatedState[field])) {
        diffs.push({
          stateCode: code,
          field,
          oldValue: existingState[field],
          newValue: updatedState[field],
        })
      }
    }
  }

  return diffs
}

export function validateScrapeResults(results: ScrapeResult[], totalStates: number): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  const successCount = results.filter(r => r.success).length
  const failureCount = results.filter(r => !r.success).length

  if (successCount < STATE_COUNT_MIN) {
    errors.push(
      `Only ${successCount}/${totalStates} states scraped successfully. Minimum is ${STATE_COUNT_MIN}. ` +
      `Aborting to prevent data loss.`
    )
  }

  if (failureCount > 0) {
    const failedStates = results
      .filter(r => !r.success)
      .map(r => `${r.stateCode}: ${r.error}`)
    warnings.push(`Failed states: ${failedStates.join('; ')}`)
  }

  return { isValid: errors.length === 0, errors, warnings }
}

export function formatDiffReport(diffs: DiffEntry[]): string {
  if (diffs.length === 0) return 'No changes detected.'

  const lines = ['## State Requirements Changes\n']

  for (const diff of diffs) {
    lines.push(`- **${diff.stateCode}** \`${diff.field}\`: ${JSON.stringify(diff.oldValue)} → ${JSON.stringify(diff.newValue)}`)
  }

  return lines.join('\n')
}
