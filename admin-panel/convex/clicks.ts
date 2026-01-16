import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Track a click
export const track = mutation({
  args: {
    sponsoredResourceId: v.id("sponsoredResources"),
    location: v.union(
      v.literal("resources_page"),
      v.literal("dashboard"),
      v.literal("curriculum_page"),
      v.literal("learning_log")
    ),
  },
  handler: async (ctx, args) => {
    const clickId = await ctx.db.insert("sponsoredClicks", {
      sponsoredResourceId: args.sponsoredResourceId,
      location: args.location,
      clickedAt: Date.now(),
    });
    return await ctx.db.get(clickId);
  },
});

// Get clicks for a resource
export const getByResource = query({
  args: {
    resourceId: v.id("sponsoredResources"),
    startDate: v.optional(v.float64()),
    endDate: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    let clicks = await ctx.db
      .query("sponsoredClicks")
      .withIndex("by_resource", (q) => q.eq("sponsoredResourceId", args.resourceId))
      .collect();

    // Filter by date range if provided
    if (args.startDate || args.endDate) {
      clicks = clicks.filter((click) => {
        if (args.startDate && click.clickedAt < args.startDate) return false;
        if (args.endDate && click.clickedAt > args.endDate) return false;
        return true;
      });
    }

    return clicks;
  },
});

// Get clicks by location
export const getByLocation = query({
  args: {
    location: v.union(
      v.literal("resources_page"),
      v.literal("dashboard"),
      v.literal("curriculum_page"),
      v.literal("learning_log")
    ),
    startDate: v.optional(v.float64()),
    endDate: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    let clicks = await ctx.db
      .query("sponsoredClicks")
      .withIndex("by_location", (q) => q.eq("location", args.location))
      .collect();

    // Filter by date range if provided
    if (args.startDate || args.endDate) {
      clicks = clicks.filter((click) => {
        if (args.startDate && click.clickedAt < args.startDate) return false;
        if (args.endDate && click.clickedAt > args.endDate) return false;
        return true;
      });
    }

    return clicks;
  },
});
