import { isCountryLocked } from "@nexora/shared/constants/country-access"
import type {
  CurrentUserOverviewResponseData,
  OptionalOverviewSource,
} from "@nexora/shared/types/aggregate"
import type { MeResponseData } from "@nexora/shared/types/auth"
import type { OnboardingMeResponseData } from "@nexora/shared/types/onboarding"
import type {
  UserDetailsResponseData,
  UserPermissionsResponseData,
} from "@nexora/shared/types/user"

import { signFileUrls } from "../clients/media-urls"
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
  const [auth, user, onboarding, userPermissions] = await Promise.allSettled([
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
    fetchFromService<UserPermissionsResponseData>(
      "user",
      "/api/v1/user/permissions",
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
  const { profileImageKey } = account
  const profileImageUrl = profileImageKey
    ? ((await signFileUrls(userId, [profileImageKey])).get(profileImageKey) ??
      null)
    : null
  const onboardingValue =
    settledValue("onboarding", onboarding, unavailable)?.onboarding ?? null
  // Without the permissions the user may do nothing and only the saved
  // country is allowed, so a failed lookup can't open anything.
  const permissions =
    settledValue("permissions", userPermissions, unavailable)?.permissions ??
    []

  return {
    account: { ...account, profileImageUrl },
    user: settledValue("user", user, unavailable),
    onboarding: onboardingValue,
    permissions,
    countryAccess: {
      savedCountry: account.countryCode,
      locked: isCountryLocked(onboardingValue),
      permittedCountries: [
        ...new Set(permissions.map(({ countryCode }) => countryCode.toLowerCase())),
      ],
    },
    unavailable,
  }
}
