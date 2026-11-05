import { z } from "zod"
import "dotenv/config"

const ttlSeconds = z.coerce.number().int().min(60).max(600).default(300)

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    PORT: z.coerce.number().int().positive().default(4006),
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

    // Credentials aren't read here: the SDK finds AWS_PROFILE or the access
    // keys locally, and the task or instance role in AWS.
    AWS_REGION: z.string().min(1),
    S3_BUCKET: z.string().min(1),
    // Presigned URLs stay short-lived; the bucket policy rejects older signatures.
    S3_UPLOAD_URL_TTL_SECONDS: ttlSeconds,

    // CloudFront distribution in front of the bucket (OAC), without a
    // trailing slash, e.g. https://d1234abcd.cloudfront.net or
    // https://media.nexora.example. Serves public/* as-is.
    CLOUDFRONT_URL: z
      .url({ protocol: /^https?$/ })
      .transform((val) => val.replace(/\/+$/, "")),
    // Optional: a CloudFront public key ID and its private key (PEM; "\n"
    // escapes allowed) from a trusted key group on the private/* behavior.
    // When unset, private files get S3 presigned GETs instead.
    CLOUDFRONT_KEY_PAIR_ID: z.string().min(1).optional(),
    CLOUDFRONT_PRIVATE_KEY: z
      .string()
      .min(1)
      .transform((val) => val.replace(/\\n/g, "\n"))
      .optional(),
    DOWNLOAD_URL_TTL_SECONDS: ttlSeconds,
  })
  .refine(
    (env) => !env.CLOUDFRONT_KEY_PAIR_ID === !env.CLOUDFRONT_PRIVATE_KEY,
    {
      message:
        "Set both CLOUDFRONT_KEY_PAIR_ID and CLOUDFRONT_PRIVATE_KEY, or neither",
      path: ["CLOUDFRONT_KEY_PAIR_ID"],
    }
  )

export const env = envSchema.parse(process.env)
