import { SIGNED_OUT_STATUSES } from "@nexora/shared/constants/auth"
import { redirect } from "next/navigation"
import { cache } from "react"
import { getCurrentUser } from "@/lib/api/auth/me"
import { ApiRenderError } from "@/lib/api/render-error"
import { href } from "@/lib/i18n/config"

/**
 * The signed-in user for Server Components, fetched once per request however
 * many components ask. Sends the browser to sign-in if the gateway rejects the
 * session; proxy.ts clears the stale cookies on the next request.
 */
export const currentUser = cache(async (country: string, lang: string) => {
  const result = await getCurrentUser()

  if (result.success) return result.data.user

  if (result.status !== undefined && SIGNED_OUT_STATUSES.has(result.status)) {
    redirect(href(country, lang, "/auth/sign-in"))
  }

  // Rate limited (429), gateway down, or another failure that says nothing
  // about the session. Signing the user out would hide the real problem;
  // error.tsx toasts the code instead.
  throw new ApiRenderError(result.code, result.status)
})
