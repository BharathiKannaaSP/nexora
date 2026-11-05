"use server"

import type {
  SignUpFormValues,
  SignUpLocale,
} from "@nexora/schemas/auth/sign-up"
import type { RegisterResponseData } from "@nexora/shared/types/auth"

import { apiResult, type ApiResult } from "../result"

export async function register(
  values: SignUpFormValues,
  localeInfo: SignUpLocale
): Promise<ApiResult<RegisterResponseData>> {
  return apiResult.post<RegisterResponseData>(
    "/auth/register",
    { ...values, ...localeInfo },
    { authenticated: false }
  )
}
