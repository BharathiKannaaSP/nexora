import { Kafka } from "kafkajs"

export const kafka = new Kafka({
  clientId: "nexora",
  brokers: ["localhost:9092"],
})
