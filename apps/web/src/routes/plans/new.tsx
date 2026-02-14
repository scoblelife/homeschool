import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, FormField } from '@homeschool/ui'
import { usePostHog } from 'posthog-js/react'

export const Route = createFileRoute('/plans/new')({
  component: NewPlanPage,
})

function NewPlanPage() {
  const posthog = usePostHog()

  const handleSaveDraft = () => {
    posthog.capture('lesson_plan_draft_saved', {
      action: 'save_draft',
    })
  }

  const handlePublish = () => {
    posthog.capture('lesson_plan_published', {
      action: 'publish',
    })
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-neutral-text mb-8">Create Lesson Plan</h1>

      <Card>
        <CardHeader>
          <CardTitle>Plan Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <FormField label="Title" required>
              <Input placeholder="e.g., Introduction to Fractions" />
            </FormField>

            <FormField label="Description">
              <Input placeholder="Brief description of this lesson plan" />
            </FormField>

            <FormField label="Duration (minutes)">
              <Input type="number" placeholder="45" />
            </FormField>

            <FormField label="Instructions">
              <Input placeholder="Step-by-step instructions for the lesson" />
            </FormField>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={handleSaveDraft}>Save Draft</Button>
              <Button variant="primary" onClick={handlePublish}>Publish</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
