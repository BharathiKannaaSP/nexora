import { KAFKA_TOPICS, startConsumer } from "@nexora/kafka"
import { userPlatformPermissionsChangedEventSchema } from "@nexora/schemas/events/permissions"
import { env } from "../config/onboarding-env"
import { applyPlatformPermissionsSnapshotRepository } from "../modules/reviewer-permission-repository"

/**
 * user-service publishes a user's whole set of platform permissions after
 * each change; it's copied into ReviewerPermission, which the round robin
 * reads to find reviewers.
 */
export const startUserPlatformPermissionsChangedConsumer =
  async (): Promise<void> => {
    await startConsumer({
      // Its own group: one group per topic keeps rebalances independent.
      groupId: `${env.KAFKA_GROUP_ID}.user-platform-permissions`,
      topic: KAFKA_TOPICS.USER_PLATFORM_PERMISSIONS_CHANGED,
      handleEvent: async (value) => {
        const event = userPlatformPermissionsChangedEventSchema.parse(value)
        const applied = await applyPlatformPermissionsSnapshotRepository(event)

        console.info(
          applied
            ? `Reviewer permissions synced for user ${event.userId}`
            : `Older permissions snapshot for user ${event.userId}, skipped`
        )
      },
    })
  }
