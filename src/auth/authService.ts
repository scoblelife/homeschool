/**
 * Authentication Service
 *
 * Handles user authentication for optional cloud features.
 * Local-first: app works fully without an account.
 *
 * Note: Cloud backend not currently connected - this is a placeholder.
 */

import { getSupabase, isSupabaseConfigured, initializeSupabase, User, Session } from './supabaseClient'

export interface AuthConfig {
  supabaseUrl: string
  supabaseAnonKey: string
}

export interface AuthState {
  isConfigured: boolean
  isAuthenticated: boolean
  user: User | null
  session: Session | null
}

class AuthService {
  private listeners: Set<(state: AuthState) => void> = new Set()

  /**
   * Configure cloud backend credentials
   */
  async configure(config: AuthConfig): Promise<void> {
    initializeSupabase(config.supabaseUrl, config.supabaseAnonKey)
  }

  /**
   * Check if cloud features are configured
   */
  isConfigured(): boolean {
    return isSupabaseConfigured()
  }

  /**
   * Get current auth state
   */
  async getState(): Promise<AuthState> {
    const supabase = getSupabase()
    if (!supabase) {
      return {
        isConfigured: isSupabaseConfigured(),
        isAuthenticated: false,
        user: null,
        session: null,
      }
    }

    // Would check actual session here if backend was connected
    return {
      isConfigured: true,
      isAuthenticated: false,
      user: null,
      session: null,
    }
  }

  /**
   * Sign up with email and password
   */
  async signUp(_email: string, _password: string): Promise<{ user: User | null; error: string | null }> {
    const supabase = getSupabase()
    if (!supabase) {
      return { user: null, error: 'Cloud features not configured. Cloud backup requires a backend connection.' }
    }

    return { user: null, error: 'Backend not connected' }
  }

  /**
   * Sign in with email and password
   */
  async signIn(_email: string, _password: string): Promise<{ user: User | null; error: string | null }> {
    const supabase = getSupabase()
    if (!supabase) {
      return { user: null, error: 'Cloud features not configured. Cloud backup requires a backend connection.' }
    }

    return { user: null, error: 'Backend not connected' }
  }

  /**
   * Sign in with OAuth provider
   */
  async signInWithOAuth(_provider: 'google' | 'github' | 'apple'): Promise<{ error: string | null }> {
    const supabase = getSupabase()
    if (!supabase) {
      return { error: 'Cloud features not configured' }
    }

    return { error: 'Backend not connected' }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<{ error: string | null }> {
    const supabase = getSupabase()
    if (!supabase) {
      return { error: 'Cloud features not configured' }
    }

    this.notifyListeners()
    return { error: null }
  }

  /**
   * Send password reset email
   */
  async resetPassword(_email: string): Promise<{ error: string | null }> {
    const supabase = getSupabase()
    if (!supabase) {
      return { error: 'Cloud features not configured' }
    }

    return { error: 'Backend not connected' }
  }

  /**
   * Subscribe to auth state changes
   */
  subscribe(callback: (state: AuthState) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  private async notifyListeners(): Promise<void> {
    const state = await this.getState()
    this.listeners.forEach((callback) => callback(state))
  }
}

export const authService = new AuthService()
