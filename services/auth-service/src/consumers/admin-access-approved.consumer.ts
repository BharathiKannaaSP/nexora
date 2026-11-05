import { KAFKA_TOPICS, startConsumer } from "@nexora/kafka"
import { adminAccessApprovedEventSchema } from "@nexora/schemas/events/permissions"
import { env } from "../config/auth-env"
import { promoteToAdminRepository } from "../modules/system-role-repository"

/**
 * onboarding-service publishes this when an admin access request is
 * approved: the user's systemRole becomes ADMIN here, while user-service
 * grants the permissions themselves (its own consumer group gets the same
 * event). The access token holds no role, so /me shows it straight away.
 */
export const startAdminAccessApprovedConsumer = async (): Promise<void> => {
  await startConsumer({
    groupId: `${env.KAFKA_GROUP_ID}.admin-access-approved`,
    topic: KAFKA_TOPICS.ADMIN_ACCESS_APPROVED,
    handleEvent: async (value) => {
      const event = adminAccessApprovedEventSchema.parse(value)
      const result = await promoteToAdminRepository(event.userId)

      if (result === "promoted" || result === "already-admin") {
        console.info(`User ${event.userId} is an ADMIN (${result})`)
        return
      }

      // Not retried: a missing user or another role won't fix itself.
      console.error(
        `Admin access request ${event.requestId} approved, but user ${event.userId} wasn't made ADMIN: ${result}`
      )
    },
  })
}
