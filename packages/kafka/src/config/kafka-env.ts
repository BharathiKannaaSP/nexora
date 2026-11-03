import { z } from "zod"
import "dotenv/config"

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  KAFKA_BROKERS: z.string(),
  KAFKA_CLIENT_ID: z.string(),
})

export const env = envSchema.parse(process.env)
