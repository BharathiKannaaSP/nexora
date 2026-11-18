import { KAFKA_TOPICS } from "@nexora/kafka"
import { createOutboxPublisher, parseObjectPayload } from "@nexora/outbox"

import { db } from "../prisma/organization-db"

export const { publishPendingOutboxEvents, startOutboxPublisher } =
  createOutboxPublisher({
    serviceName: "organization",
    outboxEvents: db.orm.public.OutboxEvent,
    // Map each event type this service publishes to its payload handler.
    handlers: {
      [KAFKA_TOPICS.ORGANIZATION_MEMBERSHIP_CREATED]: parseObjectPayload,
    },
  })
