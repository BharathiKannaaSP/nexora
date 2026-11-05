import { z } from "zod"

import {
  internalSecretSchema,
  nodeEnvSchema,
  portSchema,
} from "@nexora/shared/config/env"

import "dotenv/config"

const envSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  PORT: portSchema(4005),
  // Sent to downstream services too, which check the same secret.
  INTERNAL_SERVICE_SECRET: internalSecretSchema,
  AUTH_SERVICE_URL: z.url(),
  ONBOARDING_SERVICE_URL: z.url(),
  USER_SERVICE_URL: z.url(),
  // Per downstream call, so one slow service can't hold the whole response.
  SERVICE_TIMEOUT_MS: z.coerce.number().int().positive().default(3000),
})

export const env = envSchema.parse(process.env)
