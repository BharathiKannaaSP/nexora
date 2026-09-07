import { z } from "zod"
import "dotenv/config"

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4002),
  CONVEX_URL: z.string().min(1),
  KAFKA_GROUP_ID: z.string().min(1),
  INTERNAL_SERVICE_SECRET: z.string().min(1),
})

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  CONVEX_URL: process.env.CONVEX_URL,
  KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID,
  INTERNAL_SERVICE_SECRET: process.env.INTERNAL_SERVICE_SECRET,
})
