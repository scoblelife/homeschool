import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@homeschool/ui'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-brand-primary py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-neutral-textInverse mb-4">
            Share Lesson Plans with the Homeschool Community
          </h1>
          <p className="text-lg text-neutral-textInverse/80 max-w-2xl mx-auto mb-8">
            Discover, share, and vote on lesson plans created by homeschool families like yours.
            From Pre-K through 12th grade, find inspiration for every subject.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-neutral-text mb-8 text-center">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Browse Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-textSecondary">
                Search and filter lesson plans by grade level, subject, and activity type.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Share Your Own</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-textSecondary">
                Create and publish lesson plans to help other homeschool families.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Vote & Collect</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-textSecondary">
                Upvote plans you love and save them to your personal collections.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
