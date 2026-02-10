import { useState, useMemo } from 'react'
import { useAnalyticsSummary, useAnalytics, type SponsorAnalytics } from '../hooks/useConvex'

export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: '',
    endDate: '',
  })

  // Convert date strings to timestamps for Convex
  const startTimestamp = useMemo(() => {
    return dateRange.startDate ? new Date(dateRange.startDate).getTime() : undefined
  }, [dateRange.startDate])

  const endTimestamp = useMemo(() => {
    return dateRange.endDate ? new Date(dateRange.endDate).getTime() : undefined
  }, [dateRange.endDate])

  // Convex queries - automatically reactive
  const summary = useAnalyticsSummary(startTimestamp, endTimestamp)
  const sponsorStats = useAnalytics(startTimestamp, endTimestamp)

  const isLoading = summary === undefined || sponsorStats === undefined

  const handleClearDateRange = () => {
    setDateRange({ startDate: '', endDate: '' })
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
        <p className="text-gray-500 mt-2">Loading analytics...</p>
      </div>
    )
  }

  const totalLocationClicks = sponsorStats.reduce((acc: Record<string, number>, sponsor: SponsorAnalytics) => {
    Object.entries(sponsor.clicksByLocation).forEach(([location, clicks]) => {
      acc[location] = (acc[location] || 0) + clicks
    })
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>
          {(dateRange.startDate || dateRange.endDate) && (
            <button
              onClick={handleClearDateRange}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Monthly Recurring Revenue"
            value={`$${summary.totalRevenue.toLocaleString()}`}
            subtitle="From active sponsors"
            icon="💰"
            color="green"
          />
          <StatCard
            title="Total Clicks"
            value={summary.totalClicks.toLocaleString()}
            subtitle={dateRange.startDate ? 'In selected period' : 'All time'}
            icon="👆"
            color="blue"
          />
          <StatCard
            title="Active Sponsors"
            value={summary.activeSponsors.toString()}
            subtitle="Currently paying"
            icon="🏢"
            color="purple"
          />
          <StatCard
            title="Cost per Click"
            value={summary.totalClicks > 0 ? `$${summary.avgRevenuePerClick.toFixed(2)}` : '$0.00'}
            subtitle="Sponsor's average cost"
            icon="💵"
            color="orange"
          />
        </div>
      )}

      {/* Click Distribution by Location */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Click Distribution by Location</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <LocationCard
            location="Resources Page"
            clicks={totalLocationClicks['resources_page'] || 0}
            icon="📚"
          />
          <LocationCard
            location="Dashboard"
            clicks={totalLocationClicks['dashboard'] || 0}
            icon="📊"
          />
          <LocationCard
            location="Curriculum Page"
            clicks={totalLocationClicks['curriculum_page'] || 0}
            icon="📖"
          />
          <LocationCard
            location="Learning Log"
            clicks={totalLocationClicks['learning_log'] || 0}
            icon="📝"
          />
        </div>
      </div>

      {/* Sponsor Performance */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sponsor Performance</h3>
        {sponsorStats.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No analytics data available yet.</p>
            <p className="text-sm mt-1">Clicks will appear here once users interact with sponsored content.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sponsorStats.map((sponsor: SponsorAnalytics) => (
              <SponsorAnalyticsCard key={sponsor.sponsorId} sponsor={sponsor} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  subtitle: string
  icon: string
  color: 'green' | 'blue' | 'purple' | 'orange'
}

function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
  const colorClasses = {
    green: 'bg-green-50 text-green-700 border-green-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
  }

  return (
    <div className={`p-6 rounded-lg border-2 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs opacity-75 mt-1">{subtitle}</div>
    </div>
  )
}

interface LocationCardProps {
  location: string
  clicks: number
  icon: string
}

function LocationCard({ location, clicks, icon }: LocationCardProps) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <span className="text-sm font-medium text-gray-700">{location}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{clicks.toLocaleString()}</div>
      <div className="text-xs text-gray-500 mt-1">clicks</div>
    </div>
  )
}

interface SponsorAnalyticsCardProps {
  sponsor: SponsorAnalytics
}

function SponsorAnalyticsCard({ sponsor }: SponsorAnalyticsCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const costPerClick = sponsor.totalClicks > 0 ? sponsor.monthlyFee / sponsor.totalClicks : 0

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-4 flex-1">
          <div className="flex-1 text-left">
            <div className="flex items-center gap-3">
              <h4 className="font-semibold text-gray-900">{sponsor.sponsorName}</h4>
              <span className="px-2 py-1 text-xs bg-student-purple-100 text-brand-primaryDark rounded capitalize">
                {sponsor.tier}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              ${sponsor.monthlyFee}/month • {sponsor.totalClicks.toLocaleString()} total clicks
              {sponsor.totalClicks > 0 && (
                <span className="ml-2">• ${costPerClick.toFixed(2)} cost per click</span>
              )}
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-6 py-4 bg-white">
          {/* Clicks by Location */}
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Clicks by Location</h5>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(sponsor.clicksByLocation).map(([location, clicks]) => (
                <div key={location} className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600 capitalize">
                    {location.replace('_', ' ')}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">{clicks}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Clicks by Resource */}
          {sponsor.clicksByResource.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Top Resources</h5>
              <div className="space-y-2">
                {sponsor.clicksByResource.slice(0, 5).map((resource) => (
                  <div key={resource.resourceId} className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">{resource.resourceName}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {resource.clicks} clicks
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sponsor.clicksByResource.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              No resource clicks yet
            </div>
          )}
        </div>
      )}
    </div>
  )
}
