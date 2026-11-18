import { KAFKA_TOPICS, startConsumer } from "@nexora/kafka"
import { organizationMembershipCreatedEventSchema } from "@nexora/schemas/events/organization"

import { env } from "../config/user-env"
import { grantOrganizationPermissionsRepository } from "../modules/user-permission-repository"

/**
 * organization-service publishes this when someone joins an organization
 * (its creator, or an approved member): their permissions in it are
 * granted here. auth-service gets the same event for the role.
 */
export const startOrganizationMembershipCreatedConsumer =
  async (): Promise<void> => {
    await startConsumer({
      groupId: `${env.KAFKA_GROUP_ID}.organization-membership-created`,
      topic: KAFKA_TOPICS.ORGANIZATION_MEMBERSHIP_CREATED,
      handleEvent: async (value) => {
        const event = organizationMembershipCreatedEventSchema.parse(value)
        const added = await grantOrganizationPermissionsRepository(event)

        console.info(
          `User ${event.userId} granted ${added} permission(s) in organization ${event.organizationId}`
        )
      },
    })
  }
