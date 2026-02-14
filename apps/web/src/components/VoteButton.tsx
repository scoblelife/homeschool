import { Button } from '@homeschool/ui'
import { usePostHog } from '@posthog/react'

interface VoteButtonProps {
  planId: string
  voteCount: number
  hasVoted?: boolean
  onVote?: (planId: string) => void
}

export function VoteButton({ planId, voteCount, hasVoted = false, onVote }: VoteButtonProps) {
  const posthog = usePostHog()

  const handleVote = (event: React.MouseEvent) => {
    event.stopPropagation()
    posthog.capture('lesson_plan_voted', {
      plan_id: planId,
      vote_count_before: voteCount,
      had_voted_before: hasVoted,
    })
    onVote?.(planId)
  }

  return (
    <Button
      variant={hasVoted ? 'primary' : 'secondary'}
      size="sm"
      onClick={handleVote}
    >
      +1 ({voteCount})
    </Button>
  )
}
