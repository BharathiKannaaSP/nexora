import type { Response, NextFunction, Request } from "express"
import jwt from "jsonwebtoken"
import { env } from "../config/gateway-env"

export interface AuthenticatedRequest extends Request {
  userId?: string
}

interface AccessTokenPayload {
  sub: string
  type: "access"
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authorization = req.headers.authorization
  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Access token is required",
      code: "ACCESS_TOKEN_REQUIRED",
    })
    return
  }

  const token = authorization.slice(7)
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ["HS256"],
    }) as jwt.JwtPayload & Partial<AccessTokenPayload>

    if (typeof payload.sub !== "string" || payload.type !== "access") {
      res.status(401).json({
        success: false,
        message: "Invalid access token",
        code: "INVALID_ACCESS_TOKEN",
      })
      return
    }

    req.userId = payload.sub
    next()
  } catch {
    // jsonwebtoken's messages describe why verification failed; keep them out
    // of responses.
    res.status(401).json({
      success: false,
      message: "Invalid or expired access token",
      code: "INVALID_ACCESS_TOKEN",
    })
    return
  }
}
