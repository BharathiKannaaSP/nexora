import { KAFKA_TOPICS, startConsumer } from "@nexora/kafka"
import { env } from "../config/onboarding-env"
import { initiateForUserOnboarding } from "../modules/onboarding-service"

type InitiateUserOnboardingEvent = {
  eventId: string
  eventType: string
  userId: string
  locale: string
  country: string
}

function parseEvent(value: unknown): InitiateUserOnboardingEvent {
  if (typeof value !== "object" || value === null) {
    throw new Error("Invalid initiate user onboarding event")
  }

  const event = value as Record<string, unknown>

  if (
    typeof event.eventId !== "string" ||
    event.eventType !== KAFKA_TOPICS.INITIATE_USER_ONBOARDING ||
    typeof event.userId !== "string"
  ) {
    throw new Error("Invalid initiate user onboarding event fields")
  }

  return {
    eventId: event.eventId,
    eventType: event.eventType,
    userId: event.userId,
    locale: typeof event.locale === "string" ? event.locale : "en",
    country: typeof event.country === "string" ? event.country : "in",
  }
}

export const startInitiateUserOnboardingConsumer = async (): Promise<void> => {
  await startConsumer({
    groupId: env.KAFKA_GROUP_ID,
    topic: KAFKA_TOPICS.INITIATE_USER_ONBOARDING,
    handleEvent: async (value) => {
      const event = parseEvent(value)
      const { created } = await initiateForUserOnboarding(event.userId)

      console.info(
        created
          ? `Onboarding initiated for user ${event.userId}`
          : `Onboarding already exists for user ${event.userId}, skipping`
      )
    },
  })
}
