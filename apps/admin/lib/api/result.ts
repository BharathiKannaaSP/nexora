import type {
  ApiFieldError,
  ApiSuccessResponse,
} from "@nexora/shared/types/api"

import { api, ApiError, type MethodOptions } from "./server"

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

// Server actions read fresh data, so their requests skip the fetch cache.
const fresh = (options?: MethodOptions): MethodOptions => ({
  cache: "no-store",
  ...options,
})

/**
 * `api`, uncached and returning an ApiResult instead of throwing, e.g.
 * `apiResult.post<RegisterResponseData>("/auth/register", body)`.
 */
export const apiResult = {
  get: <T>(endpoint: string, options?: MethodOptions) =>
    toApiResult(api.get<ApiSuccessResponse<T>>(endpoint, fresh(options))),

  post: <T>(endpoint: string, body?: unknown, options?: MethodOptions) =>
    toApiResult(
      api.post<ApiSuccessResponse<T>>(endpoint, body, fresh(options))
    ),

  put: <T>(endpoint: string, body?: unknown, options?: MethodOptions) =>
    toApiResult(api.put<ApiSuccessResponse<T>>(endpoint, body, fresh(options))),

  patch: <T>(endpoint: string, body?: unknown, options?: MethodOptions) =>
    toApiResult(
      api.patch<ApiSuccessResponse<T>>(endpoint, body, fresh(options))
    ),

  delete: <T>(endpoint: string, options?: MethodOptions) =>
    toApiResult(api.delete<ApiSuccessResponse<T>>(endpoint, fresh(options))),
}
