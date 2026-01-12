/**
 * Cloud Backend Client
 *
 * Placeholder for cloud features. Currently not connected to any backend.
 * Can be configured to use Supabase, Firebase, or custom backend in the future.
 */

// Type exports that the auth service expects
export interface User {
  id: string
  email?: string
}

export interface Session {
  user: User
}

// Placeholder - no backend configured yet
let configured = false

/**
 * Initialize cloud backend (placeholder)
 */
export function initializeSupabase(_url: string, _anonKey: string): void {
  // Placeholder - would initialize cloud backend here
  configured = true
  console.log('[Auth] Cloud backend configuration stored (not connected)')
}

/**
 * Get the cloud backend client instance
 * Returns null - no backend connected yet
 */
export function getSupabase(): null {
  return null
}

/**
 * Check if cloud backend is configured
 */
export function isSupabaseConfigured(): boolean {
  return configured
}
