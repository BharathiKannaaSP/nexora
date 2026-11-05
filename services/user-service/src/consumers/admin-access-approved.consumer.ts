import { KAFKA_TOPICS, startConsumer } from "@nexora/kafka"
import { adminAccessApprovedEventSchema } from "@nexora/schemas/events/permissions"
import { env } from "../config/user-env"
import { grantAdminAccessRepository } from "../modules/user-permission-repository"

/**
 * onboarding-service publishes this when an admin access request is
 * approved: the requested platform permissions are granted here, and
 * user.platform-permissions.changed tells other services.
 */
export const startAdminAccessApprovedConsumer = async (): Promise<void> => {
  await startConsumer({
    // Its own group: one group per topic keeps rebalances independent.
    groupId: `${env.KAFKA_GROUP_ID}.admin-access-approved`,
    topic: KAFKA_TOPICS.ADMIN_ACCESS_APPROVED,
    handleEvent: async (value) => {
      const event = adminAccessApprovedEventSchema.parse(value)
      const added = await grantAdminAccessRepository(event)

      console.info(
        `Admin access request ${event.requestId} granted to user ${event.userId}: ${added} permission(s) added`
      )
    },
  })
}
