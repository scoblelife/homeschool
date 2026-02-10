import { Alert } from '@homeschool/ui'

interface ModerationBannerProps {
  reason?: string
}

export function ModerationBanner({ reason }: ModerationBannerProps) {
  return (
    <Alert variant="warning">
      This content has been flagged for review.
      {reason && <span className="block mt-1 text-sm">Reason: {reason}</span>}
    </Alert>
  )
}
