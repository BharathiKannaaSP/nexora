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
  PORT: portSchema(4004),
  ORGANIZATION_DATABASE_URL: z.url(),
  INTERNAL_SERVICE_SECRET: internalSecretSchema,
  CLIENT_ORIGINS: clientOriginsSchema,
  KAFKA_BROKERS: csvListSchema(),
  KAFKA_CLIENT_ID: z.string(),
  KAFKA_GROUP_ID: z.string().default("nexora-organization-service"),
})

export const env = envSchema.parse(process.env)
