import { kafka } from "./client.js"

const producer = kafka.producer()

let connected = false

export const connectProducer = async (): Promise<void> => {
  if (connected) return

  await producer.connect()

  connected = true
}

export const publishEvent = async <T>(
  topic: string,
  event: T
): Promise<void> => {
  await connectProducer()

  await producer.send({
    topic,
    messages: [
      {
        value: JSON.stringify(event),
      },
    ],
  })
}

export const disconnectProducer = async (): Promise<void> => {
  if (!connected) {
    return
  }

  await producer.disconnect()

  connected = false
}
