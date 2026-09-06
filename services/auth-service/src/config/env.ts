import "dotenv/config"
import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4001),
  DATABASE_URL: z.string().min(1),
  CLERK_WEBHOOK_SIGNING_SECRET: z.string().min(1),
  ADMIN_ENDPOINT: z.coerce.number().int().positive().default(3001),
  INTERNAL_SERVICE_SECRET: z.string().min(1),
})

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  CLERK_WEBHOOK_SIGNING_SECRET: process.env.CLERK_WEBHOOK_SIGNING_SECRET,
  ADMIN_ENDPOINT: process.env.ADMIN_ENDPOINT,
  INTERNAL_SERVICE_SECRET: process.env.INTERNAL_SERVICE_SECRET,
})
