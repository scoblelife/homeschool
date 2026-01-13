/**
 * Authentication Module
 *
 * Optional cloud authentication for:
 * - Cloud backup
 * - Cross-family sharing
 * - Multi-device sync beyond local network
 *
 * Local-first operation remains the default.
 */

export {
  getAuthService,
  isCloudAuthenticated,
  type CloudUser,
  type AuthState,
  type AuthCredentials,
  type AuthTokens,
  type AuthProvider,
} from './authService'
