// Envelopes every service sends: `sendSuccess` on success, `errorHandler` and
// `verifyGateway` on failure. Clients translate `code`, not `message`.

export interface ApiFieldError {
  field: string
  message: string
}

export interface ApiSuccessResponse<T> {
  success: true
  message: string
  code: string
  data: T
}

export interface ApiErrorResponse {
  success: false
  message: string
  code: string
  /** Per-field details, sent with VALIDATION_ERROR. */
  errors?: ApiFieldError[]
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse
