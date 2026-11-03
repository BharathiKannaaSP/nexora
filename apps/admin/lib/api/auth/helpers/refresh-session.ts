import { REFRESH_SHARED_RESULT_MS } from "@nexora/shared/constants/auth"
import type { ApiSuccessResponse } from "@nexora/shared/types/api"
import type { RefreshResponseData } from "@nexora/shared/types/auth"
import { ApiError, api } from "@/lib/api/server"
import {
  readRefreshCookie,
  refreshCookieHeader,
  type RefreshCookie,
  type SessionTokens,
} from "./session-cookies"

export type RefreshOutcome =
  | { status: "refreshed"; tokens: SessionTokens }
  /** Couldn't refresh right now (lost a rotation race, gateway down); keep the cookies. */
  | { status: "unchanged" }
  /** The refresh token is no good; the user has to sign in again. */
  | { status: "invalid" }

const recentRefreshes = new Map<string, Promise<RefreshOutcome>>()

/** Called from proxy.ts, which passes the browser request's headers. */
export function refreshSession(
  refreshToken: string,
  incomingHeaders: Headers
): Promise<RefreshOutcome> {
  const pending = recentRefreshes.get(refreshToken)
  if (pending) return pending

  const outcome = requestRefresh(refreshToken, incomingHeaders)
  recentRefreshes.set(refreshToken, outcome)
  setTimeout(
    () => recentRefreshes.delete(refreshToken),
    REFRESH_SHARED_RESULT_MS
  )
  return outcome
}

async function requestRefresh(
  refreshToken: string,
  incomingHeaders: Headers
): Promise<RefreshOutcome> {
  const rotated: { cookie: RefreshCookie | null } = { cookie: null }

  try {
    const { data } = await api.post<ApiSuccessResponse<RefreshResponseData>>(
      "/auth/refresh",
      undefined,
      {
        cache: "no-store",
        authenticated: false,
        incomingHeaders,
        headers: { Cookie: refreshCookieHeader(refreshToken) },
        onResponse: (response) => {
          rotated.cookie = readRefreshCookie(response)
        },
      }
    )

    if (!rotated.cookie) return { status: "invalid" }

    return {
      status: "refreshed",
      tokens: {
        accessToken: data.accessToken,
        expiresIn: data.expiresIn,
        ...rotated.cookie,
      },
    }
  } catch (error) {
    const rejected =
      error instanceof ApiError &&
      (error.status === 401 || error.status === 403) &&
      error.code !== "REFRESH_TOKEN_ROTATED"

    return { status: rejected ? "invalid" : "unchanged" }
  }
}
