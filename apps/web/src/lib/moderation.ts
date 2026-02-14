import { db } from '../db'
import { moderationQueue } from '../db/schema'
import { v4 as uuidv4 } from 'uuid'
import type { ModerationContentType } from '@homeschool/shared-types'
import { getPostHogClient } from './posthog-server'

interface ModerationResult {
  approved: boolean
  reason?: string
}

// TODO: Integrate with a 3rd-party content moderation API (e.g., OpenAI Moderation, Perspective API)
export async function moderateText(_content: string): Promise<ModerationResult> {
  return { approved: true }
}

// TODO: Integrate with an image moderation service
export async function moderateImage(_url: string): Promise<ModerationResult> {
  return { approved: true }
}

// TODO: Implement auto-flagging rules (e.g., keyword blocklists, spam detection)
export function shouldAutoFlag(_content: string): boolean {
  return false
}

export async function flagForReview(
  contentType: ModerationContentType,
  contentId: string,
  reportedBy: string | undefined,
  reason: string | undefined
): Promise<void> {
  const moderationId = uuidv4()

  await db.insert(moderationQueue).values({
    id: moderationId,
    contentType,
    contentId,
    reportedBy: reportedBy ?? null,
    reason: reason ?? null,
    autoFlagged: false,
  })

  // Track content flagged event server-side
  const posthog = getPostHogClient()
  posthog.capture({
    distinctId: reportedBy ?? 'anonymous',
    event: 'content_flagged',
    properties: {
      moderation_id: moderationId,
      content_type: contentType,
      content_id: contentId,
      reason: reason ?? null,
      auto_flagged: false,
      source: 'server',
    },
  })
}
