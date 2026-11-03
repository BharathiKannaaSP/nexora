import { z } from "zod"
import "dotenv/config"

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4001),
  AUTH_DATABASE_URL: z.url(),
  // An empty secret would let any caller pass verifyGateway and set x-user-id.
  INTERNAL_SERVICE_SECRET: z.string().min(32),
  CLIENT_ORIGINS: z
    .string()
    .default("http://localhost:3001")
    .transform((val) =>
      val
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    ),
  JWT_ACCESS_SECRET: z.string().min(32),
  // Shared with the email service; base64-encoded 32-byte AES-256 key
  TOKEN_ENCRYPTION_KEY: z
    .string()
    .transform((val) => Buffer.from(val, "base64"))
    .refine((key) => key.length === 32, {
      message: "TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key",
    }),
  KAFKA_BROKERS: z.string().transform((val) =>
    val
      .split(",")
      .map((broker) => broker.trim())
      .filter(Boolean)
  ),
  KAFKA_CLIENT_ID: z.string(),
})

export const env = envSchema.parse(process.env)
