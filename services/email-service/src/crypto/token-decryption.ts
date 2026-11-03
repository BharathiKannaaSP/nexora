import { createDecipheriv } from "node:crypto"
import {
  TOKEN_ENCRYPTION_ALGORITHM,
  TOKEN_ENCRYPTION_AUTH_TAG_BYTES,
  TOKEN_ENCRYPTION_IV_BYTES,
  TOKEN_ENCRYPTION_VERSION,
} from "@nexora/shared/constants/crypto"
import { env } from "../config/email-env"

export function decryptToken(encryptedToken: string, context: string): string {
  const parts = encryptedToken.split(".")

  if (parts.length !== 4 || parts[0] !== TOKEN_ENCRYPTION_VERSION) {
    throw new Error("Invalid encrypted verification token format")
  }

  const [, ivEncoded, tagEncoded, ciphertextEncoded] = parts

  if (!ivEncoded || !tagEncoded || ciphertextEncoded === undefined) {
    throw new Error("Incomplete encrypted verification token")
  }

  const iv = Buffer.from(ivEncoded, "base64url")
  const authTag = Buffer.from(tagEncoded, "base64url")
  const ciphertext = Buffer.from(ciphertextEncoded, "base64url")

  if (
    iv.length !== TOKEN_ENCRYPTION_IV_BYTES ||
    authTag.length !== TOKEN_ENCRYPTION_AUTH_TAG_BYTES
  ) {
    throw new Error("Invalid encrypted verification token parameters")
  }

  const decipher = createDecipheriv(
    TOKEN_ENCRYPTION_ALGORITHM,
    env.TOKEN_ENCRYPTION_KEY,
    iv
  )

  decipher.setAAD(Buffer.from(context, "utf8"))
  decipher.setAuthTag(authTag)

  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8")
}
