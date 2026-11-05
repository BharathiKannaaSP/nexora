import { createOutboxPublisher } from "@nexora/outbox"
import { db } from "../prisma/organization-db"

export const { publishPendingOutboxEvents, startOutboxPublisher } =
  createOutboxPublisher({
    serviceName: "organization",
    outboxEvents: db.orm.public.OutboxEvent,
    // Map each event type this service publishes to its payload handler,
    // e.g. "organization.created": parseObjectPayload
    handlers: {},
  })
