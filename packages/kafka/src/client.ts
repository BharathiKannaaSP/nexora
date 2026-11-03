import { Kafka, logLevel } from "kafkajs"
import { env } from "./config/kafka-env"

const brokers = (env.KAFKA_BROKERS ?? "localhost:29092")
  .split(",")
  .map((broker) => broker.trim())
  .filter(Boolean)

if (brokers.length === 0) {
  throw new Error("KAFKA_BROKERS must contain at least one broker")
}

export const kafka = new Kafka({
  clientId: env.KAFKA_CLIENT_ID ?? "nexora",
  brokers,
  logLevel: logLevel.INFO,
})
