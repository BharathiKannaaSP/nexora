import { v } from "convex/values"
import { mutation } from "../_generated/server"

export const initializeOnboarding = mutation({
  args: {
    userId: v.string(),
    clerkUserId: v.string(),
  },

  handler: async (ctx, args) => {
    const existingOnboarding = await ctx.db
      .query("onboarding")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.userId))
      .unique()

    if (existingOnboarding) {
      console.log(`Onboarding already exists for user: ${args.userId}`)

      return existingOnboarding
    }

    const now = Date.now()

    const onboardingId = await ctx.db.insert("onboarding", {
      userId: args.userId,
      clerkUserId: args.clerkUserId,
      status: "PENDING",
      currentStep: "BASIC_INFORMATION",
      createdAt: now,
      updatedAt: now,
    })

    console.log(`Created onboarding record: ${onboardingId}`)

    const onboarding = await ctx.db.get(onboardingId)

    console.log("Fetched onboarding record:", onboarding)

    if (!onboarding) {
      throw new Error(
        `Onboarding record was not found after insert: ${onboardingId}`
      )
    }

    return onboarding
  },
})
