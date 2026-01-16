import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all sponsors
export const list = query({
  args: {
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.activeOnly) {
      return await ctx.db
        .query("sponsors")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect();
    }
    return await ctx.db.query("sponsors").collect();
  },
});

// Get single sponsor
export const get = query({
  args: { id: v.id("sponsors") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create sponsor
export const create = mutation({
  args: {
    name: v.string(),
    tier: v.union(v.literal("basic"), v.literal("premium"), v.literal("enterprise")),
    logoUrl: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    monthlyFee: v.float64(),
    contactName: v.optional(v.string()),
    contactEmail: v.string(),
    githubUsername: v.optional(v.string()),
    isActive: v.boolean(),
    contractSignedDate: v.optional(v.string()),
    billingStartDate: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sponsorId = await ctx.db.insert("sponsors", args);
    return await ctx.db.get(sponsorId);
  },
});

// Update sponsor
export const update = mutation({
  args: {
    id: v.id("sponsors"),
    name: v.optional(v.string()),
    tier: v.optional(v.union(v.literal("basic"), v.literal("premium"), v.literal("enterprise"))),
    logoUrl: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    monthlyFee: v.optional(v.float64()),
    contactName: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    githubUsername: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    contractSignedDate: v.optional(v.string()),
    billingStartDate: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(id, cleanUpdates);
    return await ctx.db.get(id);
  },
});

// Delete sponsor
export const remove = mutation({
  args: { id: v.id("sponsors") },
  handler: async (ctx, args) => {
    // Delete all resources for this sponsor
    const resources = await ctx.db
      .query("sponsoredResources")
      .withIndex("by_sponsor", (q) => q.eq("sponsorId", args.id))
      .collect();

    for (const resource of resources) {
      // Delete clicks for this resource
      const clicks = await ctx.db
        .query("sponsoredClicks")
        .withIndex("by_resource", (q) => q.eq("sponsoredResourceId", resource._id))
        .collect();

      for (const click of clicks) {
        await ctx.db.delete(click._id);
      }

      // Delete the resource
      await ctx.db.delete(resource._id);
    }

    // Delete the sponsor
    await ctx.db.delete(args.id);
  },
});
