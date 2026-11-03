import type {
  NextFunction,
  Request,
  Response,
  ErrorRequestHandler,
} from "express"
import { ZodError } from "zod"
import type { ApiErrorResponse } from "../types/api"
import { AppError } from "./app-error"

const isHttpClientError = (
  error: unknown
): error is { status: number; message: string } =>
  error instanceof Error &&
  "expose" in error &&
  error.expose === true &&
  "status" in error &&
  typeof error.status === "number" &&
  error.status >= 400 &&
  error.status < 500

const sendError = (
  res: Response,
  statusCode: number,
  body: Omit<ApiErrorResponse, "success">
) => res.status(statusCode).json({ success: false, ...body })

export const notFoundHandler = (_req: Request, res: Response): void => {
  sendError(res, 404, {
    message: "Route Not Found",
    code: "ROUTE_NOT_FOUND",
  })
}

/** `serviceName` labels the log line for unexpected errors, e.g. "Auth service". */
export const createErrorHandler = (
  serviceName: string
): ErrorRequestHandler => {
  return (
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    if (error instanceof ZodError) {
      return sendError(res, 400, {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        errors: error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      })
    }

    if (error instanceof AppError) {
      return sendError(res, error.statusCode, {
        code: error.code,
        message: error.message,
      })
    }

    // Client errors from express.json(), e.g. malformed JSON or an oversized
    // body; their messages are meant to be exposed.
    if (isHttpClientError(error)) {
      return sendError(res, error.status, {
        code: "VALIDATION_ERROR",
        message: error.message,
      })
    }

    // Handle generic errors. The details stay in the log; database and driver
    // messages can describe the schema or connection.
    console.error(`${serviceName} error:`, error)

    return sendError(res, 500, {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
    })
  }
}
