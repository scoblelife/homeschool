import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle, Badge, Input } from '@homeschool/ui'

export const Route = createFileRoute('/plans/')({
  component: PlansPage,
})

function PlansPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-text mb-4">Browse Lesson Plans</h1>
        <div className="flex gap-4 flex-wrap">
          <Input
            placeholder="Search lesson plans..."
            className="max-w-md"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder cards for when data is loaded */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle>Getting started</CardTitle>
              <Badge variant="primary">Published</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-neutral-textSecondary mb-4">
              Browse and search lesson plans shared by the homeschool community.
              Plans will appear here once the database is connected.
            </p>
            <div className="flex items-center gap-2 text-sm text-neutral-textTertiary">
              <span>0 votes</span>
              <span>·</span>
              <span>0 views</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
