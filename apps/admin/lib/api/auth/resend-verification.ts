"use server"

import type { ResendVerificationResponseData } from "@nexora/shared/types/auth"

import { apiResult, type ApiResult } from "../result"

export async function resendVerification(
  identifier: string
): Promise<ApiResult<ResendVerificationResponseData>> {
  return apiResult.post<ResendVerificationResponseData>(
    "/auth/resend-verification",
    { identifier },
    { authenticated: false }
  )
}
