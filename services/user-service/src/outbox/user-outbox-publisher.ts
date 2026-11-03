import { createOutboxPublisher } from "@nexora/outbox"
import { db } from "../prisma/user-db"

export const { publishPendingOutboxEvents, startOutboxPublisher } =
  createOutboxPublisher({
    serviceName: "user",
    outboxEvents: db.orm.public.OutboxEvent,
    // Map each event type this service publishes to its payload handler,
    // e.g. "user.created": parseObjectPayload
    handlers: {},
  })
