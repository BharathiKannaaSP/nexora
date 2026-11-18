import { KAFKA_TOPICS } from "@nexora/kafka"
import { createOutboxPublisher, parseObjectPayload } from "@nexora/outbox"

import { db } from "../prisma/onboarding-db"

export const { publishPendingOutboxEvents, startOutboxPublisher } =
  createOutboxPublisher({
    serviceName: "onboarding",
    outboxEvents: db.orm.public.OutboxEvent,
    // Map each event type this service publishes to its payload handler.
    handlers: {
      [KAFKA_TOPICS.ADMIN_ACCESS_APPROVED]: parseObjectPayload,
      [KAFKA_TOPICS.ORGANIZATION_REQUEST_APPROVED]: parseObjectPayload,
    },
  })
