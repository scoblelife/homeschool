import { v } from "convex/values";
import { query } from "./_generated/server";

// Get summary statistics
export const getSummary = query({
  args: {
    startDate: v.optional(v.float64()),
    endDate: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    // Get all active sponsors
    const activeSponsors = await ctx.db
      .query("sponsors")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // Calculate total revenue (MRR)
    const totalRevenue = activeSponsors.reduce(
      (sum, sponsor) => sum + sponsor.monthlyFee,
      0
    );

    // Get all clicks
    let allClicks = await ctx.db.query("sponsoredClicks").collect();

    // Filter by date range if provided
    if (args.startDate || args.endDate) {
      allClicks = allClicks.filter((click) => {
        if (args.startDate && click.clickedAt < args.startDate) return false;
        if (args.endDate && click.clickedAt > args.endDate) return false;
        return true;
      });
    }

    const totalClicks = allClicks.length;

    // Calculate average revenue per click
    const avgRevenuePerClick = totalClicks > 0 ? totalRevenue / totalClicks : 0;

    return {
      totalRevenue,
      totalClicks,
      activeSponsors: activeSponsors.length,
      avgRevenuePerClick,
    };
  },
});

// Get detailed analytics per sponsor
export const getAnalytics = query({
  args: {
    startDate: v.optional(v.float64()),
    endDate: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    // Get all sponsors
    const sponsors = await ctx.db.query("sponsors").collect();

    // Build analytics for each sponsor
    const analytics = await Promise.all(
      sponsors.map(async (sponsor) => {
        // Get resources for this sponsor
        const resources = await ctx.db
          .query("sponsoredResources")
          .withIndex("by_sponsor", (q) => q.eq("sponsorId", sponsor._id))
          .collect();

        // Get clicks for all resources
        const clicksByResource: Record<string, number> = {};
        const clicksByLocation: Record<string, number> = {
          resources_page: 0,
          dashboard: 0,
          curriculum_page: 0,
          learning_log: 0,
        };

        let totalClicks = 0;

        for (const resource of resources) {
          let clicks = await ctx.db
            .query("sponsoredClicks")
            .withIndex("by_resource", (q) =>
              q.eq("sponsoredResourceId", resource._id)
            )
            .collect();

          // Filter by date range if provided
          if (args.startDate || args.endDate) {
            clicks = clicks.filter((click) => {
              if (args.startDate && click.clickedAt < args.startDate)
                return false;
              if (args.endDate && click.clickedAt > args.endDate) return false;
              return true;
            });
          }

          // Count clicks per resource
          clicksByResource[resource._id] = clicks.length;

          // Count clicks per location
          clicks.forEach((click) => {
            clicksByLocation[click.location] =
              (clicksByLocation[click.location] || 0) + 1;
          });

          totalClicks += clicks.length;
        }

        // Build resource performance array
        const clicksByResourceArray = resources.map((resource) => ({
          resourceId: resource._id,
          resourceName: resource.name,
          clicks: clicksByResource[resource._id] || 0,
        }));

        return {
          sponsorId: sponsor._id,
          sponsorName: sponsor.name,
          tier: sponsor.tier,
          monthlyFee: sponsor.monthlyFee,
          totalClicks,
          clicksByLocation,
          clicksByResource: clicksByResourceArray,
        };
      })
    );

    return analytics;
  },
});
