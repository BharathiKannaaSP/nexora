import { redirect } from "next/navigation"

import { API_ERROR_DIGEST_PREFIX } from "@nexora/shared/constants/api"
import { SIGNED_OUT_STATUSES } from "@nexora/shared/constants/auth"

import { href } from "@/lib/i18n/config"

import type { ApiResult } from "./result"

/**
 * An error for Server Components to throw when the gateway fails. Next hides
 * `message` in production but keeps a preset `digest`, so the backend code
 * still reaches error.tsx, which shows it as a toast.
 */
export class ApiRenderError extends Error {
  public readonly digest: string

  constructor(
    public readonly code: string,
    status?: number
  ) {
    super(`API request failed (${status ?? "no status"} ${code})`)
    this.name = "ApiRenderError"
    this.digest = `${API_ERROR_DIGEST_PREFIX}${code}`
  }
}

/** The backend code carried by an ApiRenderError, read in error.tsx. */
export const getApiErrorCode = (error: unknown): string | undefined => {
  if (!error || typeof error !== "object" || !("digest" in error)) return
  const { digest } = error as { digest: unknown }
  if (typeof digest !== "string" || !digest.startsWith(API_ERROR_DIGEST_PREFIX))
    return
  return digest.slice(API_ERROR_DIGEST_PREFIX.length)
}

/**
 * A result's data, for Server Components. Sends the browser to sign-in if the
 * gateway rejected the session; proxy.ts clears the stale cookies on the next
 * request. Any other failure (rate limited, gateway down, ...) says nothing
 * about the session, so signing the user out would hide it; it's thrown for
 * error.tsx to toast instead.
 */
export const unwrapOrRedirect = <T>(
  result: ApiResult<T>,
  country: string,
  lang: string
): T => {
  if (result.success) return result.data

  if (result.status !== undefined && SIGNED_OUT_STATUSES.has(result.status)) {
    redirect(href(country, lang, "/auth/sign-in"))
  }

  throw new ApiRenderError(result.code, result.status)
}
