"use server"

import { cookies } from "next/headers"

import type { SignInFormValues } from "@nexora/schemas/auth/sign-in"
import type { SignInResponseData } from "@nexora/shared/types/auth"

import {
  readRefreshCookie,
  writeSessionCookies,
  type RefreshCookie,
} from "@/lib/api/auth/helpers/session-cookies"

import { apiResult, type ApiResult } from "../result"

export interface LoginResponseData {
  user: SignInResponseData["user"]
}

export async function login(
  values: SignInFormValues
): Promise<ApiResult<LoginResponseData>> {
  const issued: { refresh: RefreshCookie | null } = { refresh: null }

  const result = await apiResult.post<SignInResponseData>(
    "/auth/sign-in",
    values,
    {
      authenticated: false,
      onResponse: (response) => {
        issued.refresh = readRefreshCookie(response)
      },
    }
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
