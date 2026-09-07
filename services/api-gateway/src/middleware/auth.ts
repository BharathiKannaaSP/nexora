import type { NextFunction, Request, Response } from "express"
import { verifyToken } from "@clerk/backend"
import { env } from "../config/env"

export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string
    sessionId?: string
  }
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authorization = req.header("authorization")

    if (!authorization) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHENTICATED",
          message: "Authentication required.",
        },
      })
      return
    }

    const [schema, token] = authorization.split(" ")

    if (schema?.toLowerCase() !== "bearer" || !token) {
      res.status(401).json({
        success: false,
        error: {
          code: "INVALID_AUTH_HEADER",
          message: "Invalid authorization header.",
        },
      })

      return
    }

    const verified = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
    })

    if (!verified.sub) {
      res.status(401).json({
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid authentication token.",
        },
      })

      return
    }

    req.auth = {
      userId: verified.sub,
      sessionId: typeof verified.sid === "string" ? verified.sid : undefined,
    }

    next()
  } catch (error) {
    console.error("Clerk authentication failed:", error)

    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHENTICATED",
        message: "Authentication failed.",
      },
    })
  }
}
