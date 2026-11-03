import { z } from "zod"
import "dotenv/config"

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4003),
  USER_DATABASE_URL: z.url(),
  // An empty secret would let any caller pass verifyGateway and set x-user-id.
  INTERNAL_SERVICE_SECRET: z.string().min(32),
  CLIENT_ORIGINS: z
    .string()
    .default("http://localhost:3001")
    .transform((val) =>
      val
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    ),
  KAFKA_BROKERS: z.string().transform((val) =>
    val
      .split(",")
      .map((broker) => broker.trim())
      .filter(Boolean)
  ),
  KAFKA_CLIENT_ID: z.string(),
  KAFKA_GROUP_ID: z.string().default("nexora-user-service"),
})

export const env = envSchema.parse(process.env)
