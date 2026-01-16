/**
 * Sponsor Analytics Dashboard
 *
 * View click metrics, revenue data, and sponsor performance
 * Export reports for sponsor billing and performance reviews
 */

import { useState, useEffect } from "react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { PageHeader } from "../../components/layout/PageHeader";
import { PageContainer } from "../../components/layout/PageContainer";
import { IconBadge } from "../../components/dashboard/IconBadge";
import { ResourcePerformanceRow } from "../../components/analytics/ResourcePerformanceRow";
import type { SponsorAnalytics } from "../../../../shared/types";

export default function SponsorAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<SponsorAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(
    format(startOfMonth(subMonths(new Date(), 1)), "yyyy-MM-dd"),
  );
  const [endDate, setEndDate] = useState(
    format(endOfMonth(new Date()), "yyyy-MM-dd"),
  );

  useEffect(() => {
    loadAnalytics();
  }, [startDate, endDate]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const data = await window.api.getSponsorAnalytics({
        startDate,
        endDate,
      });
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    if (analytics.length === 0) {
      alert("No data to export");
      return;
    }

    // Create CSV header
    const headers = [
      "Sponsor Name",
      "Tier",
      "Monthly Fee",
      "Total Clicks",
      "Revenue Per Click",
      "Clicks by Location",
      "Top Resources",
    ];

    // Create CSV rows
    const rows = analytics.map((sponsor) => {
      const locationClicks = Object.entries(sponsor.clicksByLocation)
        .map(([loc, count]) => `${loc}:${count}`)
        .join("; ");

      const topResources = sponsor.clicksByResource
        .slice(0, 3)
        .map((r) => `${r.resourceName}(${r.clicks})`)
        .join("; ");

      return [
        sponsor.sponsorName,
        sponsor.tier,
        `$${sponsor.monthlyFee}`,
        sponsor.totalClicks,
        sponsor.totalClicks > 0
          ? `$${(sponsor.monthlyFee / sponsor.totalClicks).toFixed(2)}`
          : "N/A",
        locationClicks,
        topResources,
      ];
    });

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");

    // Create download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `sponsor-analytics-${startDate}-to-${endDate}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate summary metrics
  const totalRevenue = analytics.reduce((sum, s) => sum + s.monthlyFee, 0);
  const totalClicks = analytics.reduce((sum, s) => sum + s.totalClicks, 0);
  const avgRevenuePerClick = totalClicks > 0 ? totalRevenue / totalClicks : 0;

  // Location breakdown
  const locationBreakdown: Record<string, number> = {};
  analytics.forEach((sponsor) => {
    Object.entries(sponsor.clicksByLocation).forEach(([location, count]) => {
      locationBreakdown[location] = (locationBreakdown[location] || 0) + count;
    });
  });

  if (isLoading) {
    return (
      <PageContainer>
        <div className="text-center text-gray-500 py-8">
          Loading analytics...
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Sponsor Analytics"
        subtitle="Performance metrics and click tracking"
        action={
          <Button
            variant="primary"
            onClick={exportToCSV}
            disabled={analytics.length === 0}
          >
            📊 Export CSV
          </Button>
        }
      />

      {/* Date Range Selector */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="pt-6">
            <Button variant="secondary" onClick={loadAnalytics}>
              Apply
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="flex items-center gap-3">
            <IconBadge icon="💰" variant="success" size="lg" />
            <div>
              <div className="text-sm font-medium text-gray-500">Total MRR</div>
              <div className="text-2xl font-bold text-status-success">
                ${totalRevenue.toLocaleString()}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <IconBadge icon="🖱️" variant="primary" size="lg" />
            <div>
              <div className="text-sm font-medium text-gray-500">
                Total Clicks
              </div>
              <div className="text-2xl font-bold text-brand-primary">
                {totalClicks.toLocaleString()}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <IconBadge icon="📈" variant="purple" size="lg" />
            <div>
              <div className="text-sm font-medium text-gray-500">
                Avg Revenue/Click
              </div>
              <div className="text-2xl font-bold text-student-purple-700">
                ${avgRevenuePerClick.toFixed(2)}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <IconBadge icon="🤝" variant="blue" size="lg" />
            <div>
              <div className="text-sm font-medium text-gray-500">
                Active Sponsors
              </div>
              <div className="text-2xl font-bold text-student-blue-700">
                {analytics.length}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Location Breakdown */}
      <Card className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Clicks by Location
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(locationBreakdown).map(([location, count]) => (
            <div
              key={location}
              className="text-center p-4 bg-gray-50 rounded-lg"
            >
              <div className="text-2xl font-bold text-brand-primary">
                {count}
              </div>
              <div className="text-sm text-gray-600 capitalize">
                {location.replace(/_/g, " ")}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Sponsor Performance Table */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Sponsor Performance ({format(new Date(startDate), "MMM d")} -{" "}
          {format(new Date(endDate), "MMM d, yyyy")})
        </h3>

        {analytics.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No click data for this time period
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Sponsor
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Tier
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">
                    Monthly Fee
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">
                    Total Clicks
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">
                    $/Click
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Top Resource
                  </th>
                </tr>
              </thead>
              <tbody>
                {analytics
                  .sort((a, b) => b.totalClicks - a.totalClicks)
                  .map((sponsor) => {
                    const topResource = sponsor.clicksByResource[0];
                    const revenuePerClick =
                      sponsor.totalClicks > 0
                        ? sponsor.monthlyFee / sponsor.totalClicks
                        : 0;

                    return (
                      <tr
                        key={sponsor.sponsorId}
                        className="border-b border-gray-100"
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">
                            {sponsor.sponsorName}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded ${
                              sponsor.tier === "enterprise"
                                ? "bg-purple-100 text-purple-700"
                                : sponsor.tier === "premium"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {sponsor.tier}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-status-success">
                          ${sponsor.monthlyFee.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-brand-primary">
                          {sponsor.totalClicks.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-600">
                          {sponsor.totalClicks > 0
                            ? `$${revenuePerClick.toFixed(2)}`
                            : "N/A"}
                        </td>
                        <td className="py-3 px-4">
                          {topResource && (
                            <div className="text-sm">
                              <div className="text-gray-900">
                                {topResource.resourceName}
                              </div>
                              <div className="text-gray-500">
                                {topResource.clicks} clicks
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Detailed Resource Performance */}
      {analytics.length > 0 && (
        <div className="mt-8 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Resource Performance by Sponsor
          </h3>
          {analytics.map((sponsor) => (
            <Card key={sponsor.sponsorId}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {sponsor.sponsorName}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {sponsor.totalClicks} total clicks • ${sponsor.monthlyFee}
                    /month
                  </p>
                </div>
              </div>

              {sponsor.clicksByResource.length > 0 ? (
                <div className="space-y-2">
                  {sponsor.clicksByResource.map((resource) => (
                    <ResourcePerformanceRow
                      key={resource.resourceId}
                      resourceName={resource.resourceName}
                      clicks={resource.clicks}
                      totalClicks={sponsor.totalClicks}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No clicks recorded
                </div>
              )}

              {/* Location breakdown for this sponsor */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-2">
                  Clicks by Location:
                </div>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(sponsor.clicksByLocation).map(
                    ([location, count]) => (
                      <div key={location} className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 capitalize">
                          {location.replace(/_/g, " ")}:
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {count}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
