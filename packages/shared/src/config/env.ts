import { z } from "zod"

/** Building blocks for each service's `src/config/*-env.ts` schema. */

export const nodeEnvSchema = z
  .enum(["development", "production", "test"])
  .default("development")

export const portSchema = (defaultPort: number) =>
  z.coerce.number().int().positive().default(defaultPort)

/** "a, b,,c" → ["a", "b", "c"]. */
export const csvListSchema = (defaultValue?: string) => {
  const base = z.string()
  return (
    defaultValue === undefined ? base : base.default(defaultValue)
  ).transform((val) =>
    val
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  )
}

/** Origins allowed by CORS; defaults to the local admin app. */
export const clientOriginsSchema = csvListSchema("http://localhost:3001")

/**
 * Shared secret every service checks in verifyGateway. An empty or short
 * secret would let any caller pass verifyGateway and set x-user-id.
 */
export const internalSecretSchema = z.string().min(32)

/** Base64-encoded 32-byte AES-256 key, decoded to a Buffer. */
export const aes256KeySchema = (name: string) =>
  z
    .string()
    .transform((val) => Buffer.from(val, "base64"))
    .refine((key) => key.length === 32, {
      message: `${name} must be a base64-encoded 32-byte key`,
    })
