import { createOutboxPublisher, parseObjectPayload } from "@nexora/outbox"
import { KAFKA_TOPICS } from "@nexora/kafka"
import { db } from "../prisma/user-db"

export const { publishPendingOutboxEvents, startOutboxPublisher } =
  createOutboxPublisher({
    serviceName: "user",
    outboxEvents: db.orm.public.OutboxEvent,
    // Map each event type this service publishes to its payload handler.
    handlers: {
      [KAFKA_TOPICS.USER_PLATFORM_PERMISSIONS_CHANGED]: parseObjectPayload,
    },
  })
