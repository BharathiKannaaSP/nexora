import "dotenv/config"
import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(4000),

  CLERK_SECRET_KEY: z.string().min(1),

  CLIENT_URL: z.string().min(1),

  ADMIN_URL: z.string().min(1),

  AUTH_SERVICE_URL: z.string().min(1),

  ONBOARDING_SERVICE_URL: z.string().min(1),

  INTERNAL_SERVICE_SECRET: z.string().min(1),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),

  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
})

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,

  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,

  CLIENT_URL: process.env.CLIENT_URL,
  ADMIN_URL: process.env.ADMIN_URL,

  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL,
  ONBOARDING_SERVICE_URL: process.env.ONBOARDING_SERVICE_URL,

  INTERNAL_SERVICE_SECRET: process.env.INTERNAL_SERVICE_SECRET,

  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
})
