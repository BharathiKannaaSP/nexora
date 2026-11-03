import type { Producer } from "kafkajs"
import { kafka } from "./client"

let producer: Producer | undefined
let connecting: Promise<Producer> | undefined

export const getKafkaProducer = async (): Promise<Producer> => {
  if (producer) return producer

  if (!connecting) {
    connecting = (async () => {
      const instance = kafka.producer()
      await instance.connect()
      producer = instance
      return instance
    })().finally(() => {
      connecting = undefined
    })
  }

  return connecting
}

export const publishEvent = async <T>(
  topic: string,
  key: string,
  event: T
): Promise<void> => {
  const instance = await getKafkaProducer()

  await instance.send({
    topic,
    acks: -1,
    messages: [
      {
        key,
        value: JSON.stringify(event),
      },
    ],
  })
}

export async function disconnectKafkaProducer(): Promise<void> {
  if (!producer) return

  const instance = producer
  producer = undefined
  await instance.disconnect()
}
