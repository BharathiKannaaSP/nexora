import { ConvexHttpClient } from "convex/browser"
import { env } from "../config/env"
import { UserCreatedEvent } from "@nexora/kafka"
import { api } from "@nexora/convex/convex/_generated/api"

const convex = new ConvexHttpClient(env.CONVEX_URL)
console.log("Convex URL:", env.CONVEX_URL)
export const initializeOnboarding = async (event: UserCreatedEvent) => {
  console.log(`Initializing onboarding for user: ${event.userId}`)

  const onboarding = await convex.mutation(
    api.onboarding.mutations.initializeOnboarding,
    {
      userId: event.userId,
      clerkUserId: event.clerkUserId,
    }
  )

  console.log("Onboarding created:", JSON.stringify(onboarding, null, 2))

  return onboarding
}
