import { cache } from "react"

import { aggregateMe } from "@/lib/api/bootstrap/aggregate-me"
import { ApiRenderError, unwrapOrRedirect } from "@/lib/api/render-error"

/**
 * The signed-in user's overview for Server Components, fetched once per
 * request however many components ask. Sends the browser to sign-in if the
 * gateway rejects the session (see unwrapOrRedirect()).
 */
export const bootstrap = cache(async (country: string, lang: string) => {
  const overview = unwrapOrRedirect(await aggregateMe(), country, lang)

  // A failed lookup also comes back as `onboarding: null`, which would send
  // an onboarded user back to step 1.
  if (overview.unavailable.includes("onboarding")) {
    throw new ApiRenderError("SERVICE_UNAVAILABLE", 502)
  }

  return overview
})
