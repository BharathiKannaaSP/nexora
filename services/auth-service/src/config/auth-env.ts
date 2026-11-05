import { z } from "zod"

import {
  aes256KeySchema,
  clientOriginsSchema,
  csvListSchema,
  internalSecretSchema,
  nodeEnvSchema,
  portSchema,
} from "@nexora/shared/config/env"

import "dotenv/config"

const envSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  PORT: portSchema(4001),
  AUTH_DATABASE_URL: z.url(),
  INTERNAL_SERVICE_SECRET: internalSecretSchema,
  CLIENT_ORIGINS: clientOriginsSchema,
  JWT_ACCESS_SECRET: z.string().min(32),
  // Shared with the email service; base64-encoded 32-byte AES-256 key
  TOKEN_ENCRYPTION_KEY: aes256KeySchema("TOKEN_ENCRYPTION_KEY"),
  KAFKA_BROKERS: csvListSchema(),
  KAFKA_CLIENT_ID: z.string(),
  KAFKA_GROUP_ID: z.string().default("nexora-auth-service"),
})

export const env = envSchema.parse(process.env)
