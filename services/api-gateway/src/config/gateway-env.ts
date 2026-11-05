import { z } from "zod"
import "dotenv/config"

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  AUTH_SERVICE_URL: z.string().url(),
  AGGREGATE_SERVICE_URL: z.string().url(),
  ONBOARDING_SERVICE_URL: z.string().url(),
  USER_SERVICE_URL: z.string().url(),
  ORGANIZATION_SERVICE_URL: z.string().url(),
  MEDIA_SERVICE_URL: z.string().url(),
  CLIENT_ORIGINS: z
    .string()
    .default("http://localhost:3001")
    .transform((val) =>
      val
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    ),
  INTERNAL_SERVICE_SECRET: z.string().min(32),
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
