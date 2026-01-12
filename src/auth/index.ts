/**
 * Auth Module
 *
 * Optional cloud account system for backup and cross-device features.
 */

export { authService, type AuthConfig, type AuthState } from './authService'
export { cloudBackupService } from './cloudBackup'
export { getSupabase, isSupabaseConfigured, initializeSupabase } from './supabaseClient'
