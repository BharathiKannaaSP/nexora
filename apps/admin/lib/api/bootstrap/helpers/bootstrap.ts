import { SIGNED_OUT_STATUSES } from "@nexora/shared/constants/auth"
import { redirect } from "next/navigation"
import { cache } from "react"
import { aggregateMe } from "@/lib/api/bootstrap/aggregate-me"
import { ApiRenderError } from "@/lib/api/render-error"
import { href } from "@/lib/i18n/config"

/**
 * The signed-in user's overview for Server Components, fetched once per
 * request however many components ask. Sends the browser to sign-in if the
 * gateway rejects the session, like currentUser().
 */
export const bootstrap = cache(async (country: string, lang: string) => {
  const result = await aggregateMe()

  if (!result.success) {
    if (result.status !== undefined && SIGNED_OUT_STATUSES.has(result.status)) {
      redirect(href(country, lang, "/auth/sign-in"))
    }
    throw new ApiRenderError(result.code, result.status)
  }

  // A failed lookup also comes back as `onboarding: null`, which would send
  // an onboarded user back to step 1.
  if (result.data.unavailable.includes("onboarding")) {
    throw new ApiRenderError("SERVICE_UNAVAILABLE", 502)
  }

  return result.data
})
