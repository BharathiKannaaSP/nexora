import type { Response } from "express"
import type { ApiSuccessResponse } from "../types/api"

export function sendSuccess<T>(
  res: Response,
  statusCode: number,
  message: string,
  code: string,
  data: T
) {
  const response: ApiSuccessResponse<T> = {
    success: true,
    message,
    code,
    data,
  }

  return res.status(statusCode).json(response)
}
