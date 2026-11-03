import { KAFKA_TOPICS, startConsumer } from "@nexora/kafka"
import { env } from "../config/email-env"
import { decryptToken } from "../crypto/token-decryption"
import { sendVerificationEmail } from "../providers/email-provider"
import { buildVerificationUrl } from "../templates/verification-email"

type VerificationEmailEvent = {
  eventId: string
  eventType: string
  userId: string
  email: string
  locale: string
  country: string
  encryptedVerificationToken: string
}

function parseEvent(value: unknown): VerificationEmailEvent {
  if (typeof value !== "object" || value === null) {
    throw new Error("Invalid verification email event")
  }

  const event = value as Record<string, unknown>

  if (
    typeof event.eventId !== "string" ||
    event.eventType !== "email.verification.requested" ||
    typeof event.userId !== "string" ||
    typeof event.email !== "string" ||
    typeof event.encryptedVerificationToken !== "string"
  ) {
    throw new Error("Invalid verification email event fields")
  }

  return {
    eventId: event.eventId,
    eventType: event.eventType,
    userId: event.userId,
    email: event.email,
    // Events published before locale support have no locale or country
    locale: typeof event.locale === "string" ? event.locale : "en",
    country: typeof event.country === "string" ? event.country : "in",
    encryptedVerificationToken: event.encryptedVerificationToken,
  }
}

export const startVerificationEmailConsumer = async (): Promise<void> => {
  await startConsumer({
    groupId: env.KAFKA_GROUP_ID,
    topic: KAFKA_TOPICS.EMAIL_VERIFICATION_REQUESTED,
    handleEvent: async (value) => {
      const event = parseEvent(value)
      const token = decryptToken(event.encryptedVerificationToken, event.email)

      const verificationUrl = buildVerificationUrl({
        country: event.country,
        locale: event.locale,
        token,
      })

      await sendVerificationEmail({
        email: event.email,
        locale: event.locale,
        verificationUrl,
      })
    },
  })
}
