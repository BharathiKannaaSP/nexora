import { EachMessagePayload } from "kafkajs"
import { kafka } from "./client"

type EventHandler = (
  event: unknown,
  context: EachMessagePayload
) => Promise<void>

export const startConsumer = async (options: {
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
