import type {
  NextFunction,
  Request,
  Response,
  ErrorRequestHandler,
} from "express"

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: "Route Not Found",
    code: "ROUTE_NOT_FOUND",
  })
}

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
