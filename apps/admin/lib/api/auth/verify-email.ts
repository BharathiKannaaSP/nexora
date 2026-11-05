"use server"

import type { VerifyEmailResponseData } from "@nexora/shared/types/auth"

import { apiResult, type ApiResult } from "../result"

export async function verifyEmail(
  token: string
): Promise<ApiResult<VerifyEmailResponseData>> {
  return apiResult.post<VerifyEmailResponseData>(
    "/auth/verify-email",
    { token },
    { authenticated: false }
  )
}
