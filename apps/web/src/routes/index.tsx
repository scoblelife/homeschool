import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function PhoneFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="bg-neutral-surface rounded-3xl shadow-xl border border-neutral-border p-2 max-w-[280px] mx-auto">
      <img
        src={src}
        alt={alt}
        className="rounded-2xl w-full"
        loading="lazy"
      />
    </div>
  )
}

function HeroSection() {
  return (
    <section className="bg-student-purple-50 py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl font-bold text-neutral-text mb-4">
              Track your homeschool days
              <span className="block text-student-purple-700">without the paperwork</span>
            </h1>
            <p className="text-lg text-neutral-textSecondary mb-4 max-w-xl">
              Log activities, track progress, and stay organized — so you can
              spend more time teaching and less time record-keeping.
            </p>
            <NevconCallout />
            <DownloadButtons />
          </div>
          <div className="flex-shrink-0">
            <PhoneFrame
              src="/screenshots/01-today.png"
              alt="Homeschool app dashboard showing daily activities, upcoming events, and milestone progress"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function NevconCallout() {
  return (
    <div className="mb-5 inline-flex items-center gap-2 bg-neutral-surface border border-neutral-border rounded-lg px-4 py-2 text-sm">
      <span className="font-semibold text-student-purple-700">NEVCON 2026</span>
      <span className="text-neutral-textSecondary">March 5-7 in Las Vegas</span>
    </div>
  )
}

function DownloadButtons() {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-student-purple-700">Coming Soon</p>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-neutral-textSecondary">
        <span>macOS: Apple Silicon | Intel</span>
        <span>Windows: Intel | Arm</span>
        <span>Linux: Intel | Arm</span>
      </div>
      <div className="flex gap-x-6 text-sm text-neutral-textSecondary">
        <span>App Store</span>
        <span>Google Play</span>
      </div>
    </div>
  )
}

interface FeatureRowProps {
  title: string
  description: string
  screenshot: string
  alt: string
  reverse: boolean
}

function FeatureRow({ title, description, screenshot, alt, reverse }: FeatureRowProps) {
  return (
    <div className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-8 md:gap-12`}>
      <div className="flex-1">
        <h3 className="text-2xl font-bold text-neutral-text mb-3">{title}</h3>
        <p className="text-neutral-textSecondary text-lg leading-relaxed">{description}</p>
      </div>
      <div className="flex-shrink-0">
        <PhoneFrame src={screenshot} alt={alt} />
      </div>
    </div>
  )
}

function FeatureSection({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <section className={`${bg} py-10 sm:py-14`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  )
}

function FeatureShowcase() {
  return (
    <>
      <FeatureSection bg="bg-neutral-surface">
        <FeatureRow
          title="Log activities in seconds"
          description="Tap to log worksheets, videos, reading, writing, and hands-on work. Quick Repeat lets you re-log yesterday's favorites with one tap. Track both kids at once."
          screenshot="/screenshots/02-log.png"
          alt="Activity logging screen with quick-repeat cards and student tabs"
          reverse={true}
        />
      </FeatureSection>
      <FeatureSection bg="bg-neutral-backgroundDeep">
        <FeatureRow
          title="See their progress at a glance"
          description="Weekly wins show what you accomplished. Subject breakdowns and milestone progress bars help you see where things stand without digging through records."
          screenshot="/screenshots/03-progress.png"
          alt="Progress screen showing weekly wins, milestone progress, and subject breakdown"
          reverse={false}
        />
      </FeatureSection>
      <FeatureSection bg="bg-neutral-surface">
        <FeatureRow
          title="Track their reading journey"
          description="Keep a running library of everything they read. Track page progress, mark grade levels, and search or filter to find any book."
          screenshot="/screenshots/04-library.png"
          alt="Book library with reading progress bars, search, and filters"
          reverse={true}
        />
      </FeatureSection>
      <FeatureSection bg="bg-neutral-backgroundDeep">
        <FeatureRow
          title="Set goals and celebrate wins"
          description="Define milestones with star ratings and target dates. Watch status badges update as your kids work toward their goals."
          screenshot="/screenshots/05-milestones.png"
          alt="Milestones list with star ratings, status badges, and descriptions"
          reverse={false}
        />
      </FeatureSection>
    </>
  )
}

function NevconSection() {
  return (
    <section className="bg-student-purple-50 py-10 sm:py-14">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-neutral-text mb-2">
          Come see us at NEVCON 2026
        </h2>
        <p className="text-lg text-neutral-textSecondary mb-2">
          March 5-7, 2026 at Sam's Town Hotel, Las Vegas
        </p>
        <p className="text-neutral-textSecondary mb-5 max-w-xl mx-auto">
          We're a Nevada homeschool family building the tool we wished we had.
          Stop by and say hi — we'd love to show you the app in person.
        </p>
        <a
          href="https://nevcon.org"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-student-purple-600 text-neutral-textInverse font-medium px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
        >
          Visit nevcon.org
        </a>
      </div>
    </section>
  )
}

const CAPABILITIES = [
  'Track daily activities by subject',
  'Log worksheets, videos, reading, writing, and hands-on work',
  'Monitor progress across subjects and kids',
  'Set and track learning milestones',
  'Keep a reading library with page-level progress',
  'Works offline, syncs across devices',
  'Nevada homeschool compliance ready',
] as const

function CapabilitiesSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <h2 className="text-2xl font-bold text-neutral-text mb-6 text-center">
        What you can do
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 max-w-4xl mx-auto">
        {CAPABILITIES.map((item) => (
          <div key={item} className="flex items-start gap-2">
            <span className="text-student-purple-700 mt-0.5 font-bold">+</span>
            <span className="text-neutral-textSecondary">{item}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function HomePage() {
  return (
    <div>
      <HeroSection />
      <FeatureShowcase />
      <NevconSection />
      <CapabilitiesSection />
    </div>
  )
}
