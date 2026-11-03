import { z } from "zod"
import "dotenv/config"

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  KAFKA_BROKERS: z.string().transform((val) =>
    val
      .split(",")
      .map((broker) => broker.trim())
      .filter(Boolean)
  ),
  KAFKA_CLIENT_ID: z.string().default("nexora-email-service"),
  KAFKA_GROUP_ID: z.string().default("nexora-email-service"),
  // Shared with the auth service; base64-encoded 32-byte AES-256 key
  TOKEN_ENCRYPTION_KEY: z
    .string()
    .transform((val) => Buffer.from(val, "base64"))
    .refine((key) => key.length === 32, {
      message: "TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key",
    }),
  FRONTEND_ADMIN_URL: z.url(),
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().email().or(z.string().min(1)),
  // Development only: send every email here instead of to the user.
  EMAIL_TO_OVERRIDE: z.email().optional(),
})

export const env = envSchema.parse(process.env)

// Redirecting every user's verification link to one inbox would let its owner
// verify any account.
if (env.NODE_ENV === "production" && env.EMAIL_TO_OVERRIDE) {
  throw new Error("EMAIL_TO_OVERRIDE must not be set in production")
}
