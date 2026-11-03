import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_TTL_MS,
} from "@nexora/shared/constants/auth"

/**
 * Both tokens live in httpOnly cookies on the admin origin, so browser
 * JavaScript never sees them. The Next.js server reads them and talks to the
 * gateway on the user's behalf.
 */
const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
}

export interface RefreshCookie {
  refreshToken: string
  /** Seconds, as sent by auth-service. */
  refreshMaxAge: number
}

export interface SessionTokens extends RefreshCookie {
  accessToken: string
  /** Access token lifetime in seconds, as reported by auth-service. */
  expiresIn: number
}

/** The parts of `cookies()` and `NextResponse.cookies` used here. */
interface CookieWriter {
  set(
    name: string,
    value: string,
    options: typeof baseCookieOptions & { maxAge: number }
  ): unknown
  delete(name: string): unknown
}

export function writeSessionCookies(
  store: CookieWriter,
  tokens: SessionTokens
) {
  store.set(ACCESS_COOKIE_NAME, tokens.accessToken, {
    ...baseCookieOptions,
    maxAge: tokens.expiresIn,
  })
  store.set(REFRESH_COOKIE_NAME, tokens.refreshToken, {
    ...baseCookieOptions,
    maxAge: tokens.refreshMaxAge,
  })
}

export function clearSessionCookies(store: CookieWriter) {
  store.delete(ACCESS_COOKIE_NAME)
  store.delete(REFRESH_COOKIE_NAME)
}

/** `Cookie` header that hands the refresh token to auth-service. */
export const refreshCookieHeader = (refreshToken: string) =>
  `${REFRESH_COOKIE_NAME}=${encodeURIComponent(refreshToken)}`

/**
 * auth-service returns the refresh token as a cookie. The response reaches
 * this server, not the browser, so it's read here and re-set on the admin
 * origin.
 */
export function readRefreshCookie(response: Response): RefreshCookie | null {
  for (const header of response.headers.getSetCookie()) {
    const [pair = "", ...attributes] = header.split(";")
    const separator = pair.indexOf("=")
    if (pair.slice(0, separator).trim() !== REFRESH_COOKIE_NAME) continue

    const maxAge = attributes
      .map((attribute) => attribute.trim().split("="))
      .find(([key]) => key?.toLowerCase() === "max-age")?.[1]

    return {
      refreshToken: decodeURIComponent(pair.slice(separator + 1).trim()),
      // Falls back to the token's lifetime when Set-Cookie has no Max-Age.
      refreshMaxAge: Number(maxAge) || REFRESH_TOKEN_TTL_MS / 1000,
    }
  }
  return null
}

/**
 * Seconds until the access token's `exp`, or 0 if it can't be read. Only
 * decides when to refresh; the gateway verifies the signature.
 */
export function secondsUntilExpiry(accessToken: string): number {
  try {
    const [, payload = ""] = accessToken.split(".")
    const { exp } = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as { exp?: unknown }
    return typeof exp === "number" ? exp - Date.now() / 1000 : 0
  } catch {
    return 0
  }
}
