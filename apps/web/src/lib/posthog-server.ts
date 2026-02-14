import { PostHog } from 'posthog-node'

let posthogClient: PostHog | null = null

export function getPostHogClient(): PostHog {
  if (!posthogClient) {
    const apiKey = process.env.VITE_PUBLIC_POSTHOG_KEY
    const host = process.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

    if (!apiKey) {
      throw new Error('[posthog-server] VITE_PUBLIC_POSTHOG_KEY environment variable is required')
    }

    posthogClient = new PostHog(apiKey, {
      host,
      flushAt: 1,
      flushInterval: 0,
    })
  }
  return posthogClient
}
