"use server"

import type { ApiSuccessResponse } from "@nexora/shared/types/api"
import type { VerifyEmailResponseData } from "@nexora/shared/types/auth"
import { toApiResult, type ApiResult } from "../result"
import { api } from "../server"

export async function verifyEmail(
  token: string
): Promise<ApiResult<VerifyEmailResponseData>> {
  return toApiResult(
    api.post<ApiSuccessResponse<VerifyEmailResponseData>>(
      "/auth/verify-email",
      { token },
      { cache: "no-store", authenticated: false }
    )
  )
}
