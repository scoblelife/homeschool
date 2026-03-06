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
              A free desktop app for logging activities, tracking progress, and
              staying organized — so you can spend more time teaching and less
              time record-keeping.
            </p>
            <NevconCallout />
            <DownloadButtons />
          </div>
          <div className="flex-shrink-0">
            <PhoneFrame
              src="/screenshots/01-today.webp"
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

const DOWNLOAD_BASE = 'https://github.com/scoblelife/homeschool/releases/download/v0.1.5'
const RELEASES_URL = 'https://github.com/scoblelife/homeschool/releases/latest'

const DOWNLOADS = {
  macArm: { label: 'macOS (Apple Silicon)', file: 'Homeschool-0.1.5-arm64.dmg' },
  macIntel: { label: 'macOS (Intel)', file: 'Homeschool-0.1.5-x64.dmg' },
  windows: { label: 'Windows', file: 'Homeschool-0.1.5-Setup.exe' },
  linuxAppImage: { label: 'Linux (.AppImage)', file: 'Homeschool-0.1.5.AppImage' },
  linuxDeb: { label: 'Linux (.deb)', file: 'Homeschool-0.1.5.deb' },
} as const

function usePlatformDownload(): { label: string; url: string } {
  if (typeof navigator === 'undefined') {
    return { label: 'Download for Mac', url: `${DOWNLOAD_BASE}/${DOWNLOADS.macArm.file}` }
  }
  const ua = navigator.userAgent
  if (ua.includes('Win')) {
    return { label: 'Download for Windows', url: `${DOWNLOAD_BASE}/${DOWNLOADS.windows.file}` }
  }
  if (ua.includes('Linux')) {
    return { label: 'Download for Linux', url: `${DOWNLOAD_BASE}/${DOWNLOADS.linuxAppImage.file}` }
  }
  return { label: 'Download for Mac', url: `${DOWNLOAD_BASE}/${DOWNLOADS.macArm.file}` }
}

function DownloadButtons() {
  const primary = usePlatformDownload()
  const linkClass = 'underline hover:text-student-purple-700'

  return (
    <div className="space-y-4">
      <a
        href={primary.url}
        className="inline-flex items-center gap-2 bg-student-purple-600 text-neutral-textInverse font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity text-lg"
      >
        {primary.label}
      </a>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-textSecondary">
        <a href={`${DOWNLOAD_BASE}/${DOWNLOADS.macArm.file}`} className={linkClass}>{DOWNLOADS.macArm.label}</a>
        <a href={`${DOWNLOAD_BASE}/${DOWNLOADS.macIntel.file}`} className={linkClass}>{DOWNLOADS.macIntel.label}</a>
        <a href={`${DOWNLOAD_BASE}/${DOWNLOADS.windows.file}`} className={linkClass}>{DOWNLOADS.windows.label}</a>
        <a href={`${DOWNLOAD_BASE}/${DOWNLOADS.linuxAppImage.file}`} className={linkClass}>{DOWNLOADS.linuxAppImage.label}</a>
        <a href={`${DOWNLOAD_BASE}/${DOWNLOADS.linuxDeb.file}`} className={linkClass}>{DOWNLOADS.linuxDeb.label}</a>
        <a href={RELEASES_URL} className={linkClass}>All downloads</a>
      </div>
      <div className="flex items-center gap-2 text-sm text-neutral-textSecondary">
        <span className="inline-block bg-student-purple-100 text-student-purple-700 font-medium px-2 py-0.5 rounded text-xs">Coming Soon</span>
        <span>iOS App Store</span>
        <span className="text-neutral-border">|</span>
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
          screenshot="/screenshots/02-log.webp"
          alt="Activity logging screen with quick-repeat cards and student tabs"
          reverse={true}
        />
      </FeatureSection>
      <FeatureSection bg="bg-neutral-backgroundDeep">
        <FeatureRow
          title="See their progress at a glance"
          description="Weekly wins show what you accomplished. Subject breakdowns and milestone progress bars help you see where things stand without digging through records."
          screenshot="/screenshots/03-progress.webp"
          alt="Progress screen showing weekly wins, milestone progress, and subject breakdown"
          reverse={false}
        />
      </FeatureSection>
      <FeatureSection bg="bg-neutral-surface">
        <FeatureRow
          title="Track their reading journey"
          description="Keep a running library of everything they read. Track page progress, mark grade levels, and search or filter to find any book."
          screenshot="/screenshots/04-library.webp"
          alt="Book library with reading progress bars, search, and filters"
          reverse={true}
        />
      </FeatureSection>
      <FeatureSection bg="bg-neutral-backgroundDeep">
        <FeatureRow
          title="Set goals and celebrate wins"
          description="Define milestones with star ratings and target dates. Watch status badges update as your kids work toward their goals."
          screenshot="/screenshots/05-milestones.webp"
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
          Find us at NEVCON 2026
        </h2>
        <p className="text-lg text-neutral-textSecondary mb-2">
          March 5-7, 2026 at Sam's Town Hotel, Las Vegas
        </p>
        <p className="text-neutral-textSecondary mb-5 max-w-xl mx-auto">
          We're a Nevada homeschool family building the tool we wished we had.
          Stop by and say hi — we'd love to show you the app and help you get started.
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
  'Free and works offline — your data stays on your computer',
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
