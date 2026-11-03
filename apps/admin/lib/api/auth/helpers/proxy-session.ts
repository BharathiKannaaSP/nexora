import { NextResponse, type NextRequest } from "next/server"
import { refreshSession } from "./refresh-session"
import {
  ACCESS_COOKIE_NAME,
  REFRESH_BEFORE_EXPIRY_SECONDS,
  REFRESH_COOKIE_NAME,
} from "@nexora/shared/constants/auth"
import {
  clearSessionCookies,
  secondsUntilExpiry,
  writeSessionCookies,
  type SessionTokens,
} from "./session-cookies"

export interface ProxySession {
  signedIn: boolean
  /** New tokens to store, or `null` to sign the browser out. */
  update?: SessionTokens | null
}

/**
 * Refreshes the access token when it's missing or about to expire. This runs
 * in proxy.ts because Server Components can't set cookies, so it has to happen
 * before rendering starts.
 */
export async function resolveSession(
  request: NextRequest
): Promise<ProxySession> {
  const accessToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value
  const remaining = accessToken ? secondsUntilExpiry(accessToken) : 0

  if (remaining > REFRESH_BEFORE_EXPIRY_SECONDS) return { signedIn: true }
  if (!refreshToken) return { signedIn: false }

  const outcome = await refreshSession(refreshToken, request.headers)

  switch (outcome.status) {
    case "refreshed":
      return { signedIn: true, update: outcome.tokens }
    case "invalid":
      return { signedIn: false, update: null }
    case "unchanged":
      return { signedIn: remaining > 0 }
  }
}

/** Continues the request with the session applied to this render and the browser. */
export function nextWithSession(request: NextRequest, session: ProxySession) {
  // Rewrite the incoming cookies so Server Components and Server Actions in
  // this same request read the new tokens.
  if (session.update) {
    request.cookies.set(ACCESS_COOKIE_NAME, session.update.accessToken)
    request.cookies.set(REFRESH_COOKIE_NAME, session.update.refreshToken)
  } else if (session.update === null) {
    request.cookies.delete(ACCESS_COOKIE_NAME)
    request.cookies.delete(REFRESH_COOKIE_NAME)
  }

  return withSessionCookies(
    NextResponse.next({ request: { headers: request.headers } }),
    session
  )
}

/** Sends the session changes to the browser on any response, e.g. a redirect. */
export function withSessionCookies(
  response: NextResponse,
  session: ProxySession
) {
  if (session.update) {
    writeSessionCookies(response.cookies, session.update)
  } else if (session.update === null) {
    clearSessionCookies(response.cookies)
  }
  return response
}
