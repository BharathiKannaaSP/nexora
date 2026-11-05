import { cacheLife } from "next/cache"

import type { ApiSuccessResponse } from "@nexora/shared/types/api"
import type { CountriesResponseData } from "@nexora/shared/types/country"

import { isCountry } from "@/lib/i18n/config"

import { toApiResult, type ApiResult } from "../result"
import { api } from "../server"

// The same for every visitor and only changes on a package upgrade, so it's
// cached across requests. Public, and given empty incoming headers, so it
// reads no cookies or request headers, which "use cache" doesn't allow.
// Kept apart from toApiResult so a failure throws and isn't cached.
const fetchCountries = async () => {
  "use cache"
  cacheLife("days")

  return api.get<ApiSuccessResponse<CountriesResponseData>>("/auth/countries", {
    authenticated: false,
    incomingHeaders: new Headers(),
  })
}

/** Every country, for Server Components. */
export async function getCountries(): Promise<
  ApiResult<CountriesResponseData>
> {
  return toApiResult(fetchCountries())
}

/**
 * The countries Nexora is offered in, the only ones onboarding can pick; the
 * world list still supplies their flags, calling codes and time zones. Forms
 * can't be filled in without it, so a failure throws, for the error boundary
 * and its retry.
 */
export async function getSupportedCountries() {
  const result = await getCountries()

  if (!result.success) {
    throw new Error(`Failed to load countries: ${result.code}`)
  }

  return result.data.countries.filter(({ code }) =>
    isCountry(code.toLowerCase())
  )
}
