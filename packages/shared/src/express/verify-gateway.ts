import type { NextFunction, Request, RequestHandler, Response } from "express"
import { timingSafeEqual } from "crypto"
import type { ApiErrorResponse } from "../types/api"

const forbidden: ApiErrorResponse = {
  success: false,
  message: "Forbidden, invalid internal secret",
  code: "FORBIDDEN",
}

/**
 * Rejects requests that didn't come through the gateway (or the aggregate
 * service), which send `expectedSecret` as `x-internal-secret`.
 */
export const createVerifyGateway = (expectedSecret: string): RequestHandler => {
  const expectedBuffer = Buffer.from(expectedSecret)

  return (req: Request, res: Response, next: NextFunction) => {
    const receivedSecret = req.headers["x-internal-secret"]

    if (typeof receivedSecret !== "string") {
      res.status(403).json(forbidden)
      return
    }

    const receivedBuffer = Buffer.from(receivedSecret)

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      res.status(403).json(forbidden)
      return
    }

    next()
  }
}
