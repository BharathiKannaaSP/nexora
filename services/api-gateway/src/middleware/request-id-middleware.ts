import type { NextFunction, Request, Response } from "express"
import { randomUUID } from "node:crypto"

export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = req.header("x-request-id") ?? randomUUID()
  res.setHeader("x-request-id", requestId)
  res.locals.requestId = requestId
  next()
}
