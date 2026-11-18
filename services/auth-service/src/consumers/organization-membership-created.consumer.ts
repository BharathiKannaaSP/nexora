import { KAFKA_TOPICS, startConsumer } from "@nexora/kafka"
import { organizationMembershipCreatedEventSchema } from "@nexora/schemas/events/organization"

import { env } from "../config/auth-env"
import { assignOrganizationRoleRepository } from "../modules/system-role-repository"

/**
 * organization-service publishes this when someone joins an organization:
 * the creator becomes ORG_ADMIN, an approved member ORG_MEMBER.
 * user-service grants the permissions from the same event.
 */
export const startOrganizationMembershipCreatedConsumer =
  async (): Promise<void> => {
    await startConsumer({
      groupId: `${env.KAFKA_GROUP_ID}.organization-membership-created`,
      topic: KAFKA_TOPICS.ORGANIZATION_MEMBERSHIP_CREATED,
      handleEvent: async (value) => {
        const event = organizationMembershipCreatedEventSchema.parse(value)
        const result = await assignOrganizationRoleRepository(
          event.userId,
          event.role
        )

        if (result === "assigned" || result === "unchanged") {
          console.info(`User ${event.userId} is ${event.role} (${result})`)
          return
        }

        // Not retried: a missing user or a higher role won't change by itself.
        console.error(
          `User ${event.userId} joined organization ${event.organizationId}, but wasn't made ${event.role}: ${result}`
        )
      },
    })
  }
