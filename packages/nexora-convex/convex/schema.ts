import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  onboarding: defineTable({
    userId: v.string(),
    clerkUserId: v.string(),
    status: v.union(
      v.literal("PENDING"),
      v.literal("IN_PROGRESS"),
      v.literal("WAITING_APPROVAL"),
      v.literal("COMPLETED"),
      v.literal("REJECTED")
    ),

    currentStep: v.union(
      v.literal("BASIC_INFORMATION"),
      v.literal("CHOOSE_PATH"),
      v.literal("ADDITIONAL_DETAILS"),
      v.literal("COMPLETED")
    ),

    path: v.optional(
      v.union(
        v.literal("JOIN_ORGANIZATION"),
        v.literal("CREATE_ORGANIZATION"),
        v.literal("BECOME_ADMIN")
      )
    ),

    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_clerkUserId", ["clerkUserId"]),
})
