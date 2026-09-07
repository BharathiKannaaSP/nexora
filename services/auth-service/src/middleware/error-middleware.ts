import type { Request, Response, NextFunction } from "express"

export const errorMiddleware = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error("API Gateway Error:", error)

  if (res.headersSent) {
    return
  }

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred.",
    },
    requestId: res.locals.requestId,
  })
}
