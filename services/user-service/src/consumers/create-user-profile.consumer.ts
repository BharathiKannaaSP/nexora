import { KAFKA_TOPICS, startConsumer } from "@nexora/kafka"
import { env } from "../config/user-env"
import { createUserProfileService } from "../modules/user-service"

// auth-service publishes this once the email is verified. onboarding-service
// consumes it too; each consumer group gets every message.
type CreateUserProfileEvent = {
  eventId: string
  eventType: string
  userId: string
  locale: string
}

function parseEvent(value: unknown): CreateUserProfileEvent {
  if (typeof value !== "object" || value === null) {
    throw new Error("Invalid create user profile event")
  }

  const event = value as Record<string, unknown>

  if (
    typeof event.eventId !== "string" ||
    event.eventType !== KAFKA_TOPICS.INITIATE_USER_ONBOARDING ||
    typeof event.userId !== "string"
  ) {
    throw new Error("Invalid create user profile event fields")
  }

  return {
    eventId: event.eventId,
    eventType: event.eventType,
    userId: event.userId,
    locale: typeof event.locale === "string" ? event.locale : "en",
  }
}

export const startCreateUserProfileConsumer = async (): Promise<void> => {
  await startConsumer({
    groupId: env.KAFKA_GROUP_ID,
    topic: KAFKA_TOPICS.INITIATE_USER_ONBOARDING,
    handleEvent: async (value) => {
      const event = parseEvent(value)
      const { created } = await createUserProfileService(
        event.userId,
        event.locale
      )

      console.info(
        created
          ? `User profile created for user ${event.userId}`
          : `User profile already exists for user ${event.userId}, skipping`
      )
    },
  })
}
