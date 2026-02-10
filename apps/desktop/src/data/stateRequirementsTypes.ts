/**
 * State Requirements Types
 *
 * TypeScript types for homeschool state requirements data.
 */

export type RegulationLevel = 'minimal' | 'low' | 'moderate' | 'high'

export interface StateRequirements {
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
  regulationLevel: RegulationLevel
}

export interface RegulationLevelInfo {
  description: string
  states: string[]
}

export interface CommonSubject {
  id: string
  name: string
  aliases: string[]
}

export interface StateRequirementsData {
  states: Record<string, StateRequirements>
  regulationLevels: Record<RegulationLevel, RegulationLevelInfo>
  commonSubjects: CommonSubject[]
}

// Import the JSON data
import stateData from './stateRequirements.json'

export const stateRequirements: StateRequirementsData = stateData as StateRequirementsData

// Helper functions
export function getStateRequirements(stateCode: string): StateRequirements | null {
  return stateRequirements.states[stateCode] || null
}

export function getAllStates(): Array<{ code: string; name: string }> {
  return Object.entries(stateRequirements.states).map(([code, data]) => ({
    code,
    name: data.name,
  })).sort((a, b) => a.name.localeCompare(b.name))
}

export function getRegulationLevelInfo(level: RegulationLevel): RegulationLevelInfo {
  return stateRequirements.regulationLevels[level]
}

export function formatRequirements(state: StateRequirements): string[] {
  const requirements: string[] = []

  if (state.requiresNotification) {
    requirements.push('Annual notification to school district required')
  }

  if (state.requiredDaysPerYear) {
    requirements.push(`${state.requiredDaysPerYear} days of instruction per year`)
  }

  if (state.requiredHoursPerYear) {
    requirements.push(`${state.requiredHoursPerYear} hours of instruction per year`)
  }

  if (state.assessmentRequired) {
    requirements.push('Annual assessment/testing required')
  }

  if (state.recordKeepingRequired) {
    requirements.push('Record keeping/portfolio required')
  }

  if (state.parentQualifications) {
    requirements.push(`Parent qualification: ${state.parentQualifications.replace(/_/g, ' ')}`)
  }

  if (state.requiredSubjects && state.requiredSubjects.length > 0) {
    requirements.push(`Required subjects: ${state.requiredSubjects.map(s => s.replace(/_/g, ' ')).join(', ')}`)
  }

  return requirements
}
