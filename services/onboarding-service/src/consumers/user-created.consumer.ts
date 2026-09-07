import { createConsumer, KAFKA_TOPICS, UserCreatedEvent } from "@nexora/kafka"
import { env } from "../config/env"
import type { Consumer } from "kafkajs"
import { initializeOnboarding } from "../services/onboarding.service"

const consumer: Consumer = createConsumer(env.KAFKA_GROUP_ID)

export const startUserCreatedConsumer = async (): Promise<void> => {
  await consumer.connect()

  await consumer.subscribe({
    topic: KAFKA_TOPICS.USER_CREATED,
    fromBeginning: true,
  })

  console.log(`Onboarding consumer subscribed to ${KAFKA_TOPICS.USER_CREATED}`)

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) {
        console.warn("Received Kafka message without value")
        return
      }

      try {
        const event = JSON.parse(message.value.toString()) as UserCreatedEvent

        if (event.eventType !== "user.created" || !event.userId) {
          console.warn("Invalid user.created event received", event)
          return
        }

        console.log(`Received user.created event: ${event.eventId}`)

        await initializeOnboarding(event)

        console.log(`Successfully processed user.created: ${event.eventId}`)
      } catch (error) {
        console.error("Failed to process user.created event:", error)
        throw error
      }
    },
  })
}

export const stopUserCreatedConsumer = async (): Promise<void> => {
  await consumer.disconnect()
}
