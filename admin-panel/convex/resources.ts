import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all sponsored resources
export const list = query({
  args: {
    activeOnly: v.optional(v.boolean()),
    sponsorId: v.optional(v.id("sponsors")),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("sponsoredResources");

    if (args.sponsorId) {
      q = q.withIndex("by_sponsor", (q) => q.eq("sponsorId", args.sponsorId));
    } else if (args.activeOnly) {
      q = q.withIndex("by_active", (q) => q.eq("isActive", true));
    }

    return await q.collect();
  },
});

// Get single resource
export const get = query({
  args: { id: v.id("sponsoredResources") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create sponsored resource
export const create = mutation({
  args: {
    sponsorId: v.id("sponsors"),
    tier: v.union(v.literal("basic"), v.literal("premium"), v.literal("enterprise")),
    name: v.string(),
    description: v.string(),
    icon: v.optional(v.string()),
    url: v.string(),
    subjects: v.array(v.string()),
    gradeLevels: v.array(v.string()),
    category: v.optional(v.string()),
    pricingInfo: v.optional(v.string()),
    displayPriority: v.float64(),
    isActive: v.boolean(),
    contractStartDate: v.string(),
    contractEndDate: v.string(),
  },
  handler: async (ctx, args) => {
    const resourceId = await ctx.db.insert("sponsoredResources", args);
    return await ctx.db.get(resourceId);
  },
});

// Update sponsored resource
export const update = mutation({
  args: {
    id: v.id("sponsoredResources"),
    sponsorId: v.optional(v.id("sponsors")),
    tier: v.optional(v.union(v.literal("basic"), v.literal("premium"), v.literal("enterprise"))),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    url: v.optional(v.string()),
    subjects: v.optional(v.array(v.string())),
    gradeLevels: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
    pricingInfo: v.optional(v.string()),
    displayPriority: v.optional(v.float64()),
    isActive: v.optional(v.boolean()),
    contractStartDate: v.optional(v.string()),
    contractEndDate: v.optional(v.string()),
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

// Delete sponsored resource
export const remove = mutation({
  args: { id: v.id("sponsoredResources") },
  handler: async (ctx, args) => {
    // Delete all clicks for this resource
    const clicks = await ctx.db
      .query("sponsoredClicks")
      .withIndex("by_resource", (q) => q.eq("sponsoredResourceId", args.id))
      .collect();

    for (const click of clicks) {
      await ctx.db.delete(click._id);
    }

    // Delete the resource
    await ctx.db.delete(args.id);
  },
});
