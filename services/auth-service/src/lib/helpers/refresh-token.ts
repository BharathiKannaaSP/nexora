import { createHash, randomBytes } from "node:crypto"
import { REFRESH_TOKEN_TTL_MS } from "@nexora/shared/constants/auth"
import { env } from "../../config/auth-env"

export const generateRefreshToken = (): string => {
  return randomBytes(32).toString("base64url")
}

export const hashRefreshToken = (token: string): string => {
  return createHash("sha256").update(token).digest("hex")
}

export const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/v1/auth",
  maxAge: REFRESH_TOKEN_TTL_MS,
}
