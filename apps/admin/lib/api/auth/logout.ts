"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { REFRESH_COOKIE_NAME } from "@nexora/shared/constants/auth"
import {
  clearSessionCookies,
  refreshCookieHeader,
} from "@/lib/api/auth/helpers/session-cookies"
import {
  defaultCountry,
  getCountryDefaultLanguage,
  isCountry,
  isCountryLanguage,
  isLocale,
  localizedPath,
} from "@/lib/i18n/config"
import type { ApiSuccessResponse } from "@nexora/shared/types/api"
import type { LogoutResponseData } from "@nexora/shared/types/auth"
import { api } from "../server"

/** Revokes the session, clears the cookies and sends the browser to sign-in. */
export async function logout(country: string, lang: string): Promise<never> {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value

  // Signed out here even if revoking fails; the session then just expires.
  await api
    .post<ApiSuccessResponse<LogoutResponseData>>("/auth/logout", undefined, {
      cache: "no-store",
      authenticated: false,
      headers: refreshToken
        ? { Cookie: refreshCookieHeader(refreshToken) }
        : undefined,
    })
    .catch(() => undefined)

  clearSessionCookies(cookieStore)

  // Redirect from here rather than from the client once the action returns.
  // Otherwise clearing the cookies makes Next re-render the current page in
  // this response, and that render's own redirect to sign-in loses the
  // language (it lands on the country default).
  const safeCountry = isCountry(country) ? country : defaultCountry
  const locale =
    isLocale(lang) && isCountryLanguage(safeCountry, lang)
      ? lang
      : getCountryDefaultLanguage(safeCountry)

  redirect(localizedPath(safeCountry, locale, "/auth/sign-in"))
}
