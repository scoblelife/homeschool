import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@homeschool/ui'
import { usePostHog } from 'posthog-js/react'

export const Route = createFileRoute('/plans/$planId')({
  component: PlanDetailPage,
})

function PlanDetailPage() {
  const { planId } = Route.useParams()
  const posthog = usePostHog()

  const handleFork = () => {
    posthog.capture('lesson_plan_forked', {
      plan_id: planId,
    })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Lesson Plan</CardTitle>
              <p className="text-sm text-neutral-textSecondary mt-1">Plan ID: {planId}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="info">Draft</Badge>
              <Button variant="secondary" size="sm" onClick={handleFork}>
                Fork
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-textSecondary">
            Plan details will be loaded from the database once connected.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
