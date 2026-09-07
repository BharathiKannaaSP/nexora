import { query } from "../_generated/server"

export const getUserById = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()

    if (!identity) {
      throw new Error("Unauthenticated")
    }

    const clerkUserId = identity.subject

    return await ctx.db
      .query("onboarding")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
      .unique()
  },
})
