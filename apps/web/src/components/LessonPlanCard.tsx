import { Card, CardContent, CardHeader, CardTitle, Badge } from '@homeschool/ui'
import { usePostHog } from '@posthog/react'
import type { LessonPlan } from '@homeschool/shared-types'
import { VoteButton } from './VoteButton'

interface LessonPlanCardProps {
  plan: LessonPlan
  onVote?: (planId: string) => void
  onClick?: (planId: string) => void
}

export function LessonPlanCard({ plan, onVote, onClick }: LessonPlanCardProps) {
  const posthog = usePostHog()

  const handleCardClick = () => {
    posthog.capture('lesson_plan_clicked', {
      plan_id: plan.id,
      plan_title: plan.title,
      plan_status: plan.status,
      grade_level: plan.gradeLevel,
      subject: plan.subject,
    })
    onClick?.(plan.id)
  }

  return (
    <Card className="cursor-pointer" onClick={handleCardClick}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle>{plan.title}</CardTitle>
          <Badge variant={plan.status === 'published' ? 'success' : 'default'}>
            {plan.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-neutral-textSecondary mb-4 line-clamp-2">
          {plan.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-neutral-textTertiary">
            <span>{plan.gradeLevel}</span>
            <span>·</span>
            <span>{plan.subject}</span>
            <span>·</span>
            <span>{plan.duration} min</span>
          </div>
          <VoteButton
            planId={plan.id}
            voteCount={plan.voteCount}
            onVote={onVote}
          />
        </div>
      </CardContent>
    </Card>
  )
}
