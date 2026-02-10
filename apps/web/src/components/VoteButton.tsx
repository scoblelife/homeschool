import { Button } from '@homeschool/ui'

interface VoteButtonProps {
  planId: string
  voteCount: number
  hasVoted?: boolean
  onVote?: (planId: string) => void
}

export function VoteButton({ planId, voteCount, hasVoted = false, onVote }: VoteButtonProps) {
  return (
    <Button
      variant={hasVoted ? 'primary' : 'secondary'}
      size="sm"
      onClick={() => onVote?.(planId)}
    >
      +1 ({voteCount})
    </Button>
  )
}
