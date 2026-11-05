import { z } from "zod"

import {
  clientOriginsSchema,
  internalSecretSchema,
  nodeEnvSchema,
  portSchema,
} from "@nexora/shared/config/env"

import "dotenv/config"

const envSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  PORT: portSchema(4000),
  AUTH_SERVICE_URL: z.url(),
  AGGREGATE_SERVICE_URL: z.url(),
  ONBOARDING_SERVICE_URL: z.url(),
  USER_SERVICE_URL: z.url(),
  ORGANIZATION_SERVICE_URL: z.url(),
  MEDIA_SERVICE_URL: z.url(),
  CLIENT_ORIGINS: clientOriginsSchema,
  INTERNAL_SERVICE_SECRET: internalSecretSchema,
  JWT_ACCESS_SECRET: z.string().min(32),
  // Proxies whose X-Forwarded-For is trusted for the client IP (Express
  // "trust proxy"): the admin Next.js server, plus any load balancer in front.
  // Anything wider lets callers spoof their IP past the rate limits.
  TRUST_PROXY: z
    .string()
    .default("loopback")
    .transform((val) => (/^\d+$/.test(val) ? Number(val) : val)),
})

export const env = envSchema.parse(process.env)
