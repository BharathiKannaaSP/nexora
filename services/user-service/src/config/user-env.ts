import { z } from "zod"

import {
  clientOriginsSchema,
  csvListSchema,
  internalSecretSchema,
  nodeEnvSchema,
  portSchema,
} from "@nexora/shared/config/env"

import "dotenv/config"

const envSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  PORT: portSchema(4003),
  USER_DATABASE_URL: z.url(),
  INTERNAL_SERVICE_SECRET: internalSecretSchema,
  CLIENT_ORIGINS: clientOriginsSchema,
  KAFKA_BROKERS: csvListSchema(),
  KAFKA_CLIENT_ID: z.string(),
  KAFKA_GROUP_ID: z.string().default("nexora-user-service"),
})

export const env = envSchema.parse(process.env)
