// Re-export all shared types from the shared-types package
export * from '@homeschool/shared-types'

// Electron-specific: window.api global declaration
import type { DatabaseAPI, SyncAPI, AIAPI, ComplianceAPI, UmbrellaSchoolAPI, SponsorshipAPI } from '@homeschool/shared-types'

declare global {
  interface Window {
    api: DatabaseAPI & SyncAPI & AIAPI & ComplianceAPI & UmbrellaSchoolAPI & SponsorshipAPI
  }
}
