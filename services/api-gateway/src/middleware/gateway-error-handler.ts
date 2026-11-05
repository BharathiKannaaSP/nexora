import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from "express"

// Unlike the services' createErrorHandler, never forwards error details:
// they can name internal hosts and ports.
export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error("API Gateway Error:", err)

  if (res.headersSent) {
    return
  }
  // The details stay in the log; they can name internal hosts and ports.
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    code: "INTERNAL_SERVER_ERROR",
  })
}
