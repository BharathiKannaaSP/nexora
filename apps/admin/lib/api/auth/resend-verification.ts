"use server"

import type { ApiSuccessResponse } from "@nexora/shared/types/api"
import type { ResendVerificationResponseData } from "@nexora/shared/types/auth"
import { toApiResult, type ApiResult } from "../result"
import { api } from "../server"

export async function resendVerification(
  identifier: string
): Promise<ApiResult<ResendVerificationResponseData>> {
  return toApiResult(
    api.post<ApiSuccessResponse<ResendVerificationResponseData>>(
      "/auth/resend-verification",
      { identifier },
      { cache: "no-store", authenticated: false }
    )
  )
}
