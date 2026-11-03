"use server"

import type { SignInFormValues } from "@nexora/schemas/auth/sign-in"
import { cookies } from "next/headers"
import {
  readRefreshCookie,
  writeSessionCookies,
  type RefreshCookie,
} from "@/lib/api/auth/helpers/session-cookies"
import type { ApiSuccessResponse } from "@nexora/shared/types/api"
import type { SignInResponseData } from "@nexora/shared/types/auth"
import { toApiResult, type ApiResult } from "../result"
import { api } from "../server"

export interface LoginResponseData {
  user: SignInResponseData["user"]
}

export async function login(
  values: SignInFormValues
): Promise<ApiResult<LoginResponseData>> {
  const issued: { refresh: RefreshCookie | null } = { refresh: null }

  const result = await toApiResult(
    api.post<ApiSuccessResponse<SignInResponseData>>("/auth/sign-in", values, {
      cache: "no-store",
      authenticated: false,
      onResponse: (response) => {
        issued.refresh = readRefreshCookie(response)
      },
    })
  )

  if (!result.success) return result
  if (!issued.refresh) return { success: false, code: "UNKNOWN_ERROR" }

  const { accessToken, expiresIn, user } = result.data
  writeSessionCookies(await cookies(), {
    accessToken,
    expiresIn,
    ...issued.refresh,
  })

  // The tokens stay in httpOnly cookies; the browser only gets the user.
  return { ...result, data: { user } }
}
