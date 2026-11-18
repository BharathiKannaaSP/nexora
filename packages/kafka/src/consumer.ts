import { EachMessagePayload } from "kafkajs"

import { kafka } from "./client"

type EventHandler = (
  event: unknown,
  context: EachMessagePayload
) => Promise<void>

const RETRY_DELAY_MS = { first: 2_000, max: 30_000 }

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Subscribes `handleEvent` to `topic`, retrying until it works. Starting can
 * fail for reasons that clear up by themselves, e.g. a topic no producer has
 * created yet, or a broker still starting; a consumer that gave up would
 * leave the service running without it, silently dropping its events.
 */
export const startConsumer = async (options: {
  groupId: string
  topic: string
  handleEvent: EventHandler
}): Promise<void> => {
  let delay = RETRY_DELAY_MS.first
  for (;;) {
    try {
      await runConsumer(options)
      return
    } catch (error) {
      console.error(
        `Kafka consumer ${options.groupId} on ${options.topic} failed to start; retrying in ${delay / 1000}s`,
        error
      )
      await sleep(delay)
      delay = Math.min(delay * 2, RETRY_DELAY_MS.max)
    }
  }
}

const runConsumer = async (options: {
  groupId: string
  topic: string
  handleEvent: EventHandler
}): Promise<void> => {
  const consumer = kafka.consumer({ groupId: options.groupId })

  await consumer.connect()

  try {
    await consumer.subscribe({
      topic: options.topic,
      fromBeginning: true,
    })

    await consumer.run({
      eachMessage: async (context) => {
        const value = context.message.value?.toString()

        if (!value) {
          throw new Error("Received an empty Kafka message")
        }

        const event = JSON.parse(value)

        await options.handleEvent(event, context)
      },
    })
  } catch (error) {
    await consumer.disconnect()
    throw error
  }
}
