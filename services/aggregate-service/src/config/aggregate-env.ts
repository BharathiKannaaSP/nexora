import { z } from "zod"
import "dotenv/config"

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4005),
  // An empty secret would let any caller pass verifyGateway and set x-user-id.
  // Also sent to downstream services, which check the same secret.
  INTERNAL_SERVICE_SECRET: z.string().min(32),
  AUTH_SERVICE_URL: z.url(),
  ONBOARDING_SERVICE_URL: z.url(),
  USER_SERVICE_URL: z.url(),
  // Per downstream call, so one slow service can't hold the whole response.
  SERVICE_TIMEOUT_MS: z.coerce.number().int().positive().default(3000),
})

export const env = envSchema.parse(process.env)
