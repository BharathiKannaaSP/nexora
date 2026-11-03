import { createOutboxPublisher } from "@nexora/outbox"
import { db } from "../prisma/onboarding-db"

export const { publishPendingOutboxEvents, startOutboxPublisher } =
  createOutboxPublisher({
    serviceName: "onboarding",
    outboxEvents: db.orm.public.OutboxEvent,
    // Map each event type this service publishes to its payload handler,
    // e.g. "onboarding.created": parseObjectPayload
    handlers: {},
  })
