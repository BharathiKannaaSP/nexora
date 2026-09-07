import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  CONVEX_URL: z.string().min(1),
  KAFKA_GROUP_ID: z.string().min(1),
})

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  CONVEX_URL: process.env.CONVEX_URL,
  KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID,
})
