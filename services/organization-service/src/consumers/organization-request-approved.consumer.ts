import { KAFKA_TOPICS, startConsumer } from "@nexora/kafka"
import { organizationRequestApprovedEventSchema } from "@nexora/schemas/events/organization"

import { env } from "../config/organization-env"
import {
  addMemberFromRequestRepository,
  createOrganizationFromRequestRepository,
} from "../modules/membership-repository"

/**
 * onboarding-service publishes this when a CREATE or JOIN request is
 * approved: the organization or the membership is created here, and
 * organization.membership.created tells user-service and auth-service.
 */
export const startOrganizationRequestApprovedConsumer =
  async (): Promise<void> => {
    await startConsumer({
      groupId: `${env.KAFKA_GROUP_ID}.organization-request-approved`,
      topic: KAFKA_TOPICS.ORGANIZATION_REQUEST_APPROVED,
      handleEvent: async (value) => {
        const event = organizationRequestApprovedEventSchema.parse(value)

        if (event.type === "CREATE") {
          const { organizationId, created } =
            await createOrganizationFromRequestRepository(event)
          console.info(
            `Organization ${organizationId} ${created ? "created" : "already created"} from request ${event.requestId}`
          )
          return
        }

        const result = await addMemberFromRequestRepository(event)
        if (result === "organization-unavailable") {
          // Not retried: a missing organization won't come back by itself.
          console.error(
            `Join request ${event.requestId} approved, but organization ${event.organizationId} is gone or not active`
          )
          return
        }
        console.info(
          `User ${event.userId} joined organization ${event.organizationId} (${result})`
        )
      },
    })
  }
