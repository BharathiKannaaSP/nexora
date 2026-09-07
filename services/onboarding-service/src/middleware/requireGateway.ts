import { NextFunction, Request, Response } from "express"
import { env } from "../config/env"

export interface GatewayRequest extends Request {
  userId?: string
}

export const requireGateway = (
  req: GatewayRequest,
  res: Response,
  next: NextFunction
) => {
  const internalSecret = req.headers["x-internal-service-secret"]
  const userId = req.headers["x-user-id"]

  if (!internalSecret) {
    return res.status(401).json({
      success: false,
      message: "Missing internal service secret",
    })
  }

  if (internalSecret !== env.INTERNAL_SERVICE_SECRET) {
    return res.status(403).json({
      success: false,
      message: "Invalid internal service secret",
    })
  }

  if (!userId || Array.isArray(userId)) {
    return res.status(401).json({
      success: false,
      message: "Missing authenticated user",
    })
  }

  req.userId = userId

  next()
}
