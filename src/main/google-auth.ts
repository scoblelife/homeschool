import { google } from 'googleapis'
import { shell, app } from 'electron'
import * as http from 'http'
import * as fs from 'fs'
import * as path from 'path'

// OAuth2 configuration
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly'
]
const REDIRECT_PORT = 8089
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/oauth2callback`

// Path to store tokens
const getTokenPath = () => path.join(app.getPath('userData'), 'google-tokens.json')
const getCredentialsPath = () => path.join(app.getPath('userData'), 'google-credentials.json')

export interface GoogleCredentials {
  client_id: string
  client_secret: string
}

export interface GoogleTokens {
  access_token: string
  refresh_token: string
  expiry_date: number
}

let oauth2Client: InstanceType<typeof google.auth.OAuth2> | null = null

/**
 * Get bundled credentials from environment variables (set at build time)
 */
function getBundledCredentials(): GoogleCredentials | null {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (clientId && clientSecret) {
    return { client_id: clientId, client_secret: clientSecret }
  }
  return null
}

/**
 * Load credentials from user's config directory (fallback for development)
 */
export function loadCredentials(): GoogleCredentials | null {
  const credPath = getCredentialsPath()
  if (fs.existsSync(credPath)) {
    try {
      const content = fs.readFileSync(credPath, 'utf-8')
      return JSON.parse(content)
    } catch {
      return null
    }
  }
  return null
}

/**
 * Get credentials - prefers bundled, falls back to user-provided
 */
function getCredentials(): GoogleCredentials | null {
  // Prefer bundled credentials (from env vars at build time)
  const bundled = getBundledCredentials()
  if (bundled) return bundled

  // Fall back to user-provided credentials file (for development)
  return loadCredentials()
}

/**
 * Save credentials to user's config directory
 */
export function saveCredentials(credentials: GoogleCredentials): void {
  const credPath = getCredentialsPath()
  fs.writeFileSync(credPath, JSON.stringify(credentials, null, 2))
}

/**
 * Get or create OAuth2 client
 */
function getOAuth2Client(): InstanceType<typeof google.auth.OAuth2> | null {
  if (oauth2Client) return oauth2Client

  const credentials = getCredentials()
  if (!credentials) return null

  oauth2Client = new google.auth.OAuth2(
    credentials.client_id,
    credentials.client_secret,
    REDIRECT_URI
  )

  // Load existing tokens if available
  const tokens = loadTokens()
  if (tokens) {
    oauth2Client.setCredentials(tokens)
  }

  return oauth2Client
}

/**
 * Load tokens from file
 */
function loadTokens(): GoogleTokens | null {
  const tokenPath = getTokenPath()
  if (fs.existsSync(tokenPath)) {
    try {
      const content = fs.readFileSync(tokenPath, 'utf-8')
      return JSON.parse(content)
    } catch {
      return null
    }
  }
  return null
}

/**
 * Save tokens to file
 */
function saveTokens(tokens: GoogleTokens): void {
  const tokenPath = getTokenPath()
  fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2))
}

/**
 * Check if we have valid credentials configured (bundled or user-provided)
 */
export function hasCredentials(): boolean {
  return getCredentials() !== null
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const tokens = loadTokens()
  return tokens !== null && tokens.refresh_token !== undefined
}

/**
 * Get authentication status
 */
export function getAuthStatus(): { hasCredentials: boolean; isAuthenticated: boolean } {
  return {
    hasCredentials: hasCredentials(),
    isAuthenticated: isAuthenticated()
  }
}

/**
 * Start OAuth flow - opens browser for user consent
 * Returns a promise that resolves when auth completes
 */
export function startAuthFlow(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const client = getOAuth2Client()
    if (!client) {
      reject(new Error('Google credentials not configured'))
      return
    }

    // Generate auth URL
    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent' // Force consent to get refresh token
    })

    // Create temporary HTTP server to receive callback
    const server = http.createServer(async (req, res) => {
      if (req.url?.startsWith('/oauth2callback')) {
        const url = new URL(req.url, `http://localhost:${REDIRECT_PORT}`)
        const code = url.searchParams.get('code')
        const error = url.searchParams.get('error')

        if (error) {
          res.writeHead(200, { 'Content-Type': 'text/html' })
          res.end('<html><body><h1>Authentication Failed</h1><p>You can close this window.</p></body></html>')
          server.close()
          reject(new Error(error))
          return
        }

        if (code) {
          try {
            const { tokens } = await client.getToken(code)
            client.setCredentials(tokens)
            saveTokens(tokens as GoogleTokens)

            res.writeHead(200, { 'Content-Type': 'text/html' })
            res.end('<html><body><h1>Authentication Successful!</h1><p>You can close this window and return to the app.</p></body></html>')
            server.close()
            resolve(true)
          } catch (err) {
            res.writeHead(200, { 'Content-Type': 'text/html' })
            res.end('<html><body><h1>Authentication Failed</h1><p>You can close this window.</p></body></html>')
            server.close()
            reject(err)
          }
        }
      }
    })

    server.listen(REDIRECT_PORT, () => {
      // Open browser for authentication
      shell.openExternal(authUrl)
    })

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close()
      reject(new Error('Authentication timed out'))
    }, 5 * 60 * 1000)
  })
}

/**
 * Disconnect Google account (remove tokens)
 */
export function disconnect(): void {
  const tokenPath = getTokenPath()
  if (fs.existsSync(tokenPath)) {
    fs.unlinkSync(tokenPath)
  }
  oauth2Client = null
}

/**
 * Get authenticated OAuth2 client for API calls
 */
export function getAuthenticatedClient(): InstanceType<typeof google.auth.OAuth2> | null {
  const client = getOAuth2Client()
  if (!client) return null

  const tokens = loadTokens()
  if (!tokens) return null

  client.setCredentials(tokens)

  // Set up token refresh handler
  client.on('tokens', (newTokens) => {
    const existingTokens = loadTokens()
    const mergedTokens = {
      ...existingTokens,
      ...newTokens
    } as GoogleTokens
    saveTokens(mergedTokens)
  })

  return client
}
