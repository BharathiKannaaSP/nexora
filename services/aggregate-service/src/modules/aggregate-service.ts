import { isCountryLocked } from "@nexora/shared/constants/country-access"
import type {
  CurrentUserOverviewResponseData,
  OptionalOverviewSource,
} from "@nexora/shared/types/aggregate"
import type { MeResponseData } from "@nexora/shared/types/auth"
import type { OnboardingMeResponseData } from "@nexora/shared/types/onboarding"
import type {
  PlatformCountriesResponseData,
  UserDetailsResponseData,
} from "@nexora/shared/types/user"

import { fetchFromService } from "../clients/service-client"

const settledValue = <T>(
  source: OptionalOverviewSource,
  result: PromiseSettledResult<T>,
  unavailable: OptionalOverviewSource[]
): T | null => {
  if (result.status === "fulfilled") {
    return result.value
  }

  console.error(`Aggregate service: ${source} failed`, result.reason)
  unavailable.push(source)
  return null
}

export const getCurrentUserOverview = async (
  userId: string
): Promise<CurrentUserOverviewResponseData> => {
  const [auth, user, onboarding, platformCountries] = await Promise.allSettled([
    fetchFromService<MeResponseData>("auth", "/api/v1/auth/me", userId),
    fetchFromService<UserDetailsResponseData>(
      "user",
      "/api/v1/user/user-details",
      userId
    ),
    fetchFromService<OnboardingMeResponseData>(
      "onboarding",
      "/api/v1/onboarding/onboardingDetails",
      userId
    ),
    fetchFromService<PlatformCountriesResponseData>(
      "user",
      "/api/v1/user/platform-countries",
      userId
    ),
  ])

  // Auth decides whether the account exists and is active, so its failure
  // fails the whole request.
  if (auth.status === "rejected") {
    throw auth.reason
  }

  // The other sources are optional. They come back as null and are listed in
  // `unavailable`, so clients can tell a failed service from an empty result.
  const unavailable: OptionalOverviewSource[] = []
  const account = auth.value.user
  const onboardingValue =
    settledValue("onboarding", onboarding, unavailable)?.onboarding ?? null

  return {
    account,
    user: settledValue("user", user, unavailable),
    onboarding: onboardingValue,
    // Without the permissions only the saved country is allowed, so a
    // failed lookup can't open other countries.
    countryAccess: {
      savedCountry: account.countryCode,
      locked: isCountryLocked(onboardingValue),
      permittedCountries:
        settledValue("permissions", platformCountries, unavailable)
          ?.countries ?? [],
    },
    unavailable,
  }
}
