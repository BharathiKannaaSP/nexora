import { createCipheriv, randomBytes } from "node:crypto"
import {
  TOKEN_ENCRYPTION_ALGORITHM,
  TOKEN_ENCRYPTION_IV_BYTES,
  TOKEN_ENCRYPTION_VERSION,
} from "@nexora/shared/constants/crypto"
import { env } from "../../config/auth-env"

/**
 * Encrypts a token for the outbox so only the email service (which holds the
 * same key) can read it. `context` is bound as AAD — the recipient email — so
 * the ciphertext can't be replayed against a different address.
 *
 * Format: `v1.<iv>.<authTag>.<ciphertext>`, each part base64url.
 * Email service decrypts with createDecipheriv("aes-256-gcm", key, iv),
 * setAAD(context), setAuthTag(authTag).
 */
export const encryptToken = (token: string, context: string): string => {
  const iv = randomBytes(TOKEN_ENCRYPTION_IV_BYTES)
  const cipher = createCipheriv(
    TOKEN_ENCRYPTION_ALGORITHM,
    env.TOKEN_ENCRYPTION_KEY,
    iv
  )
  cipher.setAAD(Buffer.from(context, "utf8"))

  const ciphertext = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ])

  return [TOKEN_ENCRYPTION_VERSION, iv, cipher.getAuthTag(), ciphertext]
    .map((part) =>
      typeof part === "string" ? part : part.toString("base64url")
    )
    .join(".")
}
