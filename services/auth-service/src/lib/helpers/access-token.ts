import jwt from "jsonwebtoken"
import { ACCESS_TOKEN_TTL_SECONDS } from "@nexora/shared/constants/auth"
import { env } from "../../config/auth-env"
import { AppError } from "@nexora/shared/express/app-error"

export const signInAccessToken = (userId: string): string => {
  const secret = env.JWT_ACCESS_SECRET

  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new AppError(
      "JWT_ACCESS_SECRET must be at least 32 bytes",
      500,
      "JWT_ACCESS_SECRET_INVALID"
    )
  }

  return jwt.sign(
    {
      type: "access",
    },
    secret,
    {
      algorithm: "HS256",
      subject: userId,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    }
  )
}
