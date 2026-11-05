import type { Request } from "express"

import { AppError } from "./app-error"

/** Set by the gateway after it verifies the access token. */
export const USER_ID_HEADER = "x-user-id"

type UnauthorizedError = { message: string; code: string }

export const UNAUTHORIZED: UnauthorizedError = {
  message: "Unauthorized",
  code: "UNAUTHORIZED",
}

export const ACCESS_TOKEN_REQUIRED: UnauthorizedError = {
  message: "Access token is required",
  code: "ACCESS_TOKEN_REQUIRED",
}

/** The user the gateway authenticated, or a 401. */
export const requireUserId = (
  req: Request,
  error: UnauthorizedError = UNAUTHORIZED
): string => {
  const userId = req.headers[USER_ID_HEADER]

  if (typeof userId !== "string" || !userId) {
    throw new AppError(error.message, 401, error.code)
  }
  return userId
}
