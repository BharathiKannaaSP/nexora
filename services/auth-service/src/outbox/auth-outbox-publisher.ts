import { KAFKA_TOPICS } from "@nexora/kafka"
import { createOutboxPublisher, type OutboxEventHandler } from "@nexora/outbox"
import { db } from "../prisma/auth-db"

const parseEmailVerificationPayload: OutboxEventHandler = (value) => {
  if (typeof value !== "object" || value === null) {
    throw new Error("Invalid email verification outbox payload")
  }

  const payload = value as Record<string, unknown>

  if (
    typeof payload.userId !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.encryptedVerificationToken !== "string"
  ) {
    throw new Error("Invalid email verification outbox payload")
  }

  return {
    userId: payload.userId,
    email: payload.email,
    locale: typeof payload.locale === "string" ? payload.locale : "en",
    country: typeof payload.country === "string" ? payload.country : "in",
    encryptedVerificationToken: payload.encryptedVerificationToken,
  }
}

const parseUserOnboardingInitiate: OutboxEventHandler = (value) => {
  if (typeof value !== "object" || value === null) {
    throw new Error("Invalid user onboarding initiate outbox payload")
  }

  const payload = value as Record<string, unknown>

  if (
    typeof payload.userId !== "string" ||
    typeof payload.locale !== "string" ||
    typeof payload.country !== "string"
  ) {
    throw new Error("Invalid user onboarding initiate outbox payload")
  }

  return {
    userId: payload.userId,
    locale: payload.locale,
    country: payload.country,
  }
}

export const { publishPendingOutboxEvents, startOutboxPublisher } =
  createOutboxPublisher({
    serviceName: "auth",
    outboxEvents: db.orm.public.OutboxEvent,
    handlers: {
      [KAFKA_TOPICS.EMAIL_VERIFICATION_REQUESTED]:
        parseEmailVerificationPayload,
      [KAFKA_TOPICS.INITIATE_USER_ONBOARDING]: parseUserOnboardingInitiate,
    },
  })
