"use server"

import type {
  SignUpFormValues,
  SignUpLocale,
} from "@nexora/schemas/auth/sign-up"
import type { ApiSuccessResponse } from "@nexora/shared/types/api"
import type { RegisterResponseData } from "@nexora/shared/types/auth"
import { toApiResult, type ApiResult } from "../result"
import { api } from "../server"

export async function register(
  values: SignUpFormValues,
  localeInfo: SignUpLocale
): Promise<ApiResult<RegisterResponseData>> {
  return toApiResult(
    api.post<ApiSuccessResponse<RegisterResponseData>>(
      "/auth/register",
      { ...values, ...localeInfo },
      { cache: "no-store", authenticated: false }
    )
  )
}
