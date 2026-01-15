/**
 * Cloud Authentication Service
 *
 * Provides optional cloud account functionality for:
 * - Cloud backup of data
 * - Cross-family sharing (co-op networking)
 * - Multi-device sync beyond local network
 *
 * Local-first remains the default - cloud features are opt-in.
 */

import { getDatabase } from '../database'

// Types
export interface CloudUser {
  id: string
  email: string
  displayName?: string
  createdAt: string
  lastLoginAt: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: CloudUser | null
  isLoading: boolean
  error: string | null
}

export interface AuthCredentials {
  email: string
  password: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export type AuthProvider = 'email' | 'google' | 'apple'

// Storage keys
const AUTH_TOKENS_KEY = 'auth_tokens'
const AUTH_USER_KEY = 'auth_user'

// Cloud API configuration
// TODO: Replace with actual backend URL when deployed
const CLOUD_API_URL = process.env.CLOUD_API_URL || 'https://api.homeschool.scoble.life'

/**
 * Cloud Authentication Service
 *
 * Manages user authentication for cloud features.
 * All methods are no-ops if cloud backend is not configured.
 */
class AuthService {
  private static instance: AuthService | null = null

  private state: AuthState = {
    isAuthenticated: false,
    user: null,
    isLoading: false,
    error: null,
  }

  private tokens: AuthTokens | null = null
  private stateListeners: Set<(state: AuthState) => void> = new Set()

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  /**
   * Initialize the auth service
   * Loads any cached tokens and validates them
   */
  async initialize(): Promise<void> {
    try {
      this.updateState({ isLoading: true, error: null })

      // Try to load cached tokens
      const db = await getDatabase()
      const tokensResult = await db.all<{ value: string }>(
        `SELECT value FROM settings WHERE key = ?`,
        [AUTH_TOKENS_KEY]
      )

      if (tokensResult.length > 0) {
        this.tokens = JSON.parse(tokensResult[0].value)

        // Validate tokens
        if (this.tokens && this.tokens.expiresAt > Date.now()) {
          // Load cached user
          const userResult = await db.all<{ value: string }>(
            `SELECT value FROM settings WHERE key = ?`,
            [AUTH_USER_KEY]
          )

          if (userResult.length > 0) {
            const user = JSON.parse(userResult[0].value) as CloudUser
            this.updateState({
              isAuthenticated: true,
              user,
              isLoading: false,
            })
            return
          }
        } else if (this.tokens?.refreshToken) {
          // Token expired, try to refresh
          await this.refreshTokens()
          return
        }
      }

      this.updateState({ isLoading: false })
    } catch (err) {
      console.error('[Auth] Initialization error:', err)
      this.updateState({
        isLoading: false,
        error: 'Failed to initialize authentication',
      })
    }
  }

  /**
   * Get current auth state
   */
  getState(): AuthState {
    return { ...this.state }
  }

  /**
   * Subscribe to auth state changes
   */
  onStateChange(listener: (state: AuthState) => void): () => void {
    this.stateListeners.add(listener)
    // Immediately call with current state
    listener(this.state)
    return () => this.stateListeners.delete(listener)
  }

  /**
   * Sign up with email and password
   */
  async signUp(credentials: AuthCredentials, displayName?: string): Promise<void> {
    try {
      this.updateState({ isLoading: true, error: null })

      const response = await fetch(`${CLOUD_API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          displayName,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json() as { message?: string }
        throw new Error(errorData.message || 'Sign up failed')
      }

      const data = await response.json() as { user: CloudUser; tokens: AuthTokens }
      await this.handleAuthSuccess(data.user, data.tokens)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed'
      this.updateState({ isLoading: false, error: message })
      throw err
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(credentials: AuthCredentials): Promise<void> {
    try {
      this.updateState({ isLoading: true, error: null })

      const response = await fetch(`${CLOUD_API_URL}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const errorData = await response.json() as { message?: string }
        throw new Error(errorData.message || 'Sign in failed')
      }

      const data = await response.json() as { user: CloudUser; tokens: AuthTokens }
      await this.handleAuthSuccess(data.user, data.tokens)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed'
      this.updateState({ isLoading: false, error: message })
      throw err
    }
  }

  /**
   * Sign in with OAuth provider
   */
  async signInWithProvider(provider: AuthProvider): Promise<void> {
    try {
      this.updateState({ isLoading: true, error: null })

      // OAuth flow would open browser/webview for provider login
      // For now, this is a placeholder
      throw new Error(`OAuth with ${provider} is not yet implemented`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'OAuth sign in failed'
      this.updateState({ isLoading: false, error: message })
      throw err
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      // Clear server-side session if we have tokens
      if (this.tokens?.accessToken) {
        await fetch(`${CLOUD_API_URL}/auth/signout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.tokens.accessToken}`,
          },
        }).catch(() => {
          // Ignore errors - we're signing out anyway
        })
      }
    } finally {
      // Always clear local state
      await this.clearAuthData()
      this.tokens = null
      this.updateState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
      })
    }
  }

  /**
   * Get access token for API calls
   * Returns null if not authenticated
   */
  async getAccessToken(): Promise<string | null> {
    if (!this.tokens) return null

    // Check if token is expired
    if (this.tokens.expiresAt <= Date.now()) {
      await this.refreshTokens()
    }

    return this.tokens?.accessToken || null
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.state.isAuthenticated
  }

  /**
   * Get current user
   */
  getCurrentUser(): CloudUser | null {
    return this.state.user
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      const response = await fetch(`${CLOUD_API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const errorData = await response.json() as { message?: string }
        throw new Error(errorData.message || 'Password reset request failed')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Password reset failed'
      throw new Error(message)
    }
  }

  /**
   * Delete account
   */
  async deleteAccount(): Promise<void> {
    if (!this.tokens?.accessToken) {
      throw new Error('Not authenticated')
    }

    try {
      const response = await fetch(`${CLOUD_API_URL}/auth/delete-account`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.tokens.accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json() as { message?: string }
        throw new Error(errorData.message || 'Account deletion failed')
      }

      await this.signOut()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Account deletion failed'
      throw new Error(message)
    }
  }

  // Private methods

  private updateState(partialState: Partial<AuthState>): void {
    this.state = { ...this.state, ...partialState }
    this.notifyListeners()
  }

  private notifyListeners(): void {
    const listeners = Array.from(this.stateListeners)
    for (const listener of listeners) {
      try {
        listener(this.state)
      } catch (err) {
        console.error('[Auth] Error in state listener:', err)
      }
    }
  }

  private async handleAuthSuccess(user: CloudUser, tokens: AuthTokens): Promise<void> {
    this.tokens = tokens

    // Persist tokens and user
    const db = await getDatabase()
    await db.run(
      `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
      [AUTH_TOKENS_KEY, JSON.stringify(tokens)]
    )
    await db.run(
      `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
      [AUTH_USER_KEY, JSON.stringify(user)]
    )

    this.updateState({
      isAuthenticated: true,
      user,
      isLoading: false,
      error: null,
    })
  }

  private async refreshTokens(): Promise<void> {
    if (!this.tokens?.refreshToken) {
      await this.signOut()
      return
    }

    try {
      const response = await fetch(`${CLOUD_API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.tokens.refreshToken }),
      })

      if (!response.ok) {
        await this.signOut()
        return
      }

      const data = await response.json() as { user: CloudUser; tokens: AuthTokens }
      await this.handleAuthSuccess(data.user, data.tokens)
    } catch (err) {
      console.error('[Auth] Token refresh failed:', err)
      await this.signOut()
    }
  }

  private async clearAuthData(): Promise<void> {
    try {
      const db = await getDatabase()
      await db.run(`DELETE FROM settings WHERE key IN (?, ?)`, [
        AUTH_TOKENS_KEY,
        AUTH_USER_KEY,
      ])
    } catch (err) {
      console.error('[Auth] Failed to clear auth data:', err)
    }
  }
}

/**
 * Get the singleton AuthService instance.
 *
 * @returns The shared AuthService instance used by the application.
 */
export function getAuthService(): AuthService {
  return AuthService.getInstance()
}

/**
 * Checks whether the client is currently authenticated with the cloud service.
 *
 * @returns `true` if the client is authenticated with the cloud service, `false` otherwise.
 */
export function isCloudAuthenticated(): boolean {
  return AuthService.getInstance().isAuthenticated()
}