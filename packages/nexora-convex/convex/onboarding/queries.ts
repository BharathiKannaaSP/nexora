import { v } from "convex/values"
import { query } from "../_generated/server"

export const getUserById = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("onboarding")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique()
  },
})
