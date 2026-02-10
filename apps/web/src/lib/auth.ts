import type { WebUser } from '@homeschool/shared-types'

// TODO: Integrate with a real auth provider (e.g., Clerk, Auth.js, Lucia)

export async function getCurrentUser(): Promise<WebUser | null> {
  // Stub: no authenticated user
  return null
}

export async function requireAuth(): Promise<WebUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

export function isAuthenticated(): boolean {
  // Stub: always unauthenticated
  return false
}

export function isModerator(user: WebUser): boolean {
  return user.isModerator && !user.isBanned
}
