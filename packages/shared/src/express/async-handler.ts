import type { NextFunction, Request, Response, RequestHandler } from "express"

type AsyncController = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>

/** Passes a rejected controller promise to Express's error handler. */
export const asyncHandler = (controller: AsyncController): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(controller(req, res, next)).catch(next)
  }
}
