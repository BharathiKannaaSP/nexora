import type {
  ApiFieldError,
  ApiSuccessResponse,
} from "@nexora/shared/types/api"
import { ApiError } from "./server"

/**
 * Serializable result returned from server actions. The client never reads
 * `message` for display — it translates `code` via the `codes` namespace.
 */
export type ApiResult<T> =
  | { success: true; code: string; data: T }
  | {
      success: false
      code: string
      status?: number
      errors?: ApiFieldError[]
    }

/** Wraps a service call so server actions return the backend code instead of throwing. */
export async function toApiResult<T>(
  request: Promise<ApiSuccessResponse<T>>
): Promise<ApiResult<T>> {
  try {
    const { code, data } = await request
    return { success: true, code, data }
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        success: false,
        code: error.code,
        status: error.status,
        errors: error.errors,
      }
    }
    return { success: false, code: "UNKNOWN_ERROR" }
  }
}
