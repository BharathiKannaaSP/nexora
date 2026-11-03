import { Temporal } from "temporal-polyfill"
import { publishEvent } from "@nexora/kafka"
import {
  OUTBOX_BASE_RETRY_DELAY_MS,
  OUTBOX_BATCH_SIZE,
  OUTBOX_MAX_ATTEMPTS,
  OUTBOX_MAX_RETRY_DELAY_MS,
  OUTBOX_POLL_INTERVAL_MS,
} from "@nexora/shared/constants/outbox"

export type OutboxEventStatus =
  "PENDING" | "PROCESSING" | "PUBLISHED" | "FAILED"

export type OutboxEventRecord = {
  id: string
  eventType: string
  aggregateId: string
  payload: unknown
  attempts: number
  availableAt: Temporal.Instant
}

// The slice of a service's Prisma OutboxEvent model the publisher needs, so
// each service can pass `db.orm.public.OutboxEvent` as is.
export type OutboxEventModel = {
  where(filter: { id?: string; status: OutboxEventStatus }): {
    all(): PromiseLike<OutboxEventRecord[]>
    update(data: {
      status: OutboxEventStatus
      attempts?: number
      availableAt?: Temporal.Instant
      publishedAt?: Temporal.Instant
      lastError: string | null
    }): PromiseLike<unknown>
  }
}

// Validates an outbox payload and returns the fields of the published event.
export type OutboxEventHandler = (payload: unknown) => Record<string, unknown>

export type OutboxPublisherOptions = {
  serviceName: string
  outboxEvents: OutboxEventModel
  // Event types this service is allowed to publish; the event type doubles as the Kafka topic
  handlers: Record<string, OutboxEventHandler>
}

export const parseObjectPayload: OutboxEventHandler = (value) => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Invalid outbox payload")
  }

  return value as Record<string, unknown>
}

const retryDelayMs = (attempt: number): number => {
  const exponentialDelay =
    OUTBOX_BASE_RETRY_DELAY_MS * 2 ** Math.max(0, attempt - 1) // Exponential backoff based on attempt number

  return Math.min(exponentialDelay, OUTBOX_MAX_RETRY_DELAY_MS) // Ensure the delay does not exceed the maximum retry delay
}

export const createOutboxPublisher = ({
  serviceName,
  outboxEvents,
  handlers,
}: OutboxPublisherOptions) => {
  const processEvent = async (event: OutboxEventRecord) => {
    const now = Temporal.Now.instant()
    const nextAttempt = event.attempts + 1

    await outboxEvents
      .where({
        id: event.id,
        status: "PENDING",
      })
      .update({
        status: "PROCESSING",
        attempts: nextAttempt,
        lastError: null,
      })

    try {
      const handler = handlers[event.eventType]

      if (!handler) {
        throw new Error(`Unsupported event type: ${event.eventType}`)
      }

      await publishEvent(event.eventType, event.aggregateId, {
        eventId: event.id,
        eventType: event.eventType,
        occurredAt: now.toString(),
        ...handler(event.payload),
      })

      await outboxEvents
        .where({
          id: event.id,
          status: "PROCESSING",
        })
        .update({
          status: "PUBLISHED",
          publishedAt: Temporal.Now.instant(),
          lastError: null,
        })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown publishing error"

      const failedPermanently = nextAttempt >= OUTBOX_MAX_ATTEMPTS

      await outboxEvents
        .where({
          id: event.id,
          status: "PROCESSING",
        })
        .update({
          status: failedPermanently ? "FAILED" : "PENDING",
          availableAt: Temporal.Now.instant().add({
            milliseconds: retryDelayMs(nextAttempt),
          }),
          lastError: message.slice(0, 2_000),
        })

      console.error(`${serviceName} outbox event publishing failed`, {
        eventId: event.id,
        eventType: event.eventType,
        attempt: nextAttempt,
        permanentlyFailed: failedPermanently,
        error: message,
      })
    }
  }

  const publishPendingOutboxEvents = async (): Promise<void> => {
    const now = Temporal.Now.instant()

    const pendingEvents = await outboxEvents
      .where({
        status: "PENDING",
      })
      .all()

    const dueEvents = pendingEvents
      .filter((event) => Temporal.Instant.compare(event.availableAt, now) <= 0) // Compare event's availableAt with the current time to determine if it's due for processing
      .slice(0, OUTBOX_BATCH_SIZE) // Limit the number of events processed in this batch to OUTBOX_BATCH_SIZE

    for (const event of dueEvents) {
      await processEvent(event)
    }
  }

  const startOutboxPublisher = async (): Promise<void> => {
    console.info(`Starting Nexora ${serviceName} outbox publisher`)

    while (true) {
      try {
        await publishPendingOutboxEvents()
      } catch (error) {
        console.error(`${serviceName} outbox polling failed`, error)
      }

      await new Promise<void>((resolve) => {
        setTimeout(resolve, OUTBOX_POLL_INTERVAL_MS)
      })
    }
  }

  return { publishPendingOutboxEvents, startOutboxPublisher }
}
