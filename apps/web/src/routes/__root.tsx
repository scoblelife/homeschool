import { createRootRoute, HeadContent, Link, Outlet, Scripts } from '@tanstack/react-router'
import appCss from '../styles/globals.css?url'

export const Route = createRootRoute({
  head: () => ({
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16.png' },
      { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
    ],
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'description', content: 'Track your homeschool days without the paperwork. Log activities, track progress, and stay organized.' },
      { title: 'Homeschool' },
    ],
  }),
  component: RootDocument,
})

function RootDocument() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
          <div className="min-h-screen flex flex-col bg-neutral-background">
            <SiteHeader />
            <main className="flex-1">
              <Outlet />
            </main>
            <SiteFooter />
          </div>
        <Scripts />
      </body>
    </html>
  )
}

function SiteHeader() {
  return (
    <header className="border-b border-neutral-border bg-neutral-surface">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-student-purple-700">
          Homeschool
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <a
            href="https://www.skool.com/homeschool-mastery-group/about?ref=7c41311a194449f6b1e7465215d7dcb5"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-textSecondary hover:text-student-purple-700 transition-colors"
          >
            Mastery Group
          </a>
          <a href="/privacy.html" className="text-neutral-textSecondary hover:text-student-purple-700 transition-colors">
            Privacy
          </a>
          <a href="/terms.html" className="text-neutral-textSecondary hover:text-student-purple-700 transition-colors">
            Terms
          </a>
          <a href="/support.html" className="text-neutral-textSecondary hover:text-student-purple-700 transition-colors">
            Support
          </a>
        </div>
      </nav>
    </header>
  )
}

function SiteFooter() {
  return (
    <footer className="border-t border-neutral-border bg-neutral-surface py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-neutral-textSecondary text-sm">
            Built by a Nevada homeschool family
          </p>
          <FooterLinks />
        </div>
      </div>
    </footer>
  )
}

function FooterLinks() {
  return (
    <div className="flex items-center flex-wrap gap-4 text-sm">
      <a
        href="https://www.skool.com/homeschool-mastery-group/about?ref=7c41311a194449f6b1e7465215d7dcb5"
        target="_blank"
        rel="noopener noreferrer"
        className="text-neutral-textSecondary hover:text-student-purple-700 transition-colors"
      >
        Mastery Group
      </a>
      <a href="/privacy.html" className="text-neutral-textSecondary hover:text-student-purple-700 transition-colors">
        Privacy
      </a>
      <a href="/terms.html" className="text-neutral-textSecondary hover:text-student-purple-700 transition-colors">
        Terms
      </a>
      <a href="/support.html" className="text-neutral-textSecondary hover:text-student-purple-700 transition-colors">
        Support
      </a>
      <a
        href="https://nevcon.org"
        target="_blank"
        rel="noopener noreferrer"
        className="text-neutral-textSecondary hover:text-student-purple-700 transition-colors"
      >
        NEVCON
      </a>
    </div>
  )
}
