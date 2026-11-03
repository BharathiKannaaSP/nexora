import type { ApiSuccessResponse } from "@nexora/shared/types/api"
import type { CountriesResponseData } from "@nexora/shared/types/country"
import { cacheLife } from "next/cache"
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
