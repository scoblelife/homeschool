import { createRootRoute, Link, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-background">
      <header className="border-b border-neutral-border bg-neutral-surface">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-brand-primary">
            Homeschool Community
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-neutral-text hover:text-brand-primary transition-colors">
              Home
            </Link>
            <Link to="/plans" className="text-neutral-text hover:text-brand-primary transition-colors">
              Browse Plans
            </Link>
          </div>
        </nav>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-neutral-border bg-neutral-surface py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-neutral-textSecondary text-sm">
          Homeschool Community — Share and discover lesson plans
        </div>
      </footer>
    </div>
  )
}
