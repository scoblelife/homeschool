import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  sponsors: defineTable({
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
  })
    .index("by_active", ["isActive"])
    .index("by_tier", ["tier"]),

  sponsoredResources: defineTable({
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
  })
    .index("by_sponsor", ["sponsorId"])
    .index("by_active", ["isActive"])
    .index("by_priority", ["displayPriority"]),

  sponsoredClicks: defineTable({
    sponsoredResourceId: v.id("sponsoredResources"),
    location: v.union(
      v.literal("resources_page"),
      v.literal("dashboard"),
      v.literal("curriculum_page"),
      v.literal("learning_log")
    ),
    clickedAt: v.float64(), // timestamp
  })
    .index("by_resource", ["sponsoredResourceId"])
    .index("by_location", ["location"])
    .index("by_time", ["clickedAt"]),
});
