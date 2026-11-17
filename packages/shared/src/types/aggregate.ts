// `data` of aggregate-service responses.

import type { PlatformPermission } from "@nexora/schemas/events/permissions"

import type { CountryAccess } from "../constants/country-access"
import type { CurrentUser } from "./auth"
import type { Onboarding } from "./onboarding"
import type { UserDetailsResponseData } from "./user"

/** Sources the overview can do without; auth failing fails the request. */
export type OptionalOverviewSource = "user" | "onboarding" | "permissions"

/** The account, with its avatar signed so it can be shown. */
export interface OverviewAccount extends CurrentUser {
  /** Short-lived CloudFront URL; null without an image or if signing failed. */
  profileImageUrl: string | null
}

/** GET /aggregate/me */
export interface CurrentUserOverviewResponseData {
  account: OverviewAccount
  user: UserDetailsResponseData | null
  onboarding: Onboarding | null
  /**
   * The user's platform permissions, from user-service. Empty when that
   * lookup failed ("permissions" is then in `unavailable`).
   */
  permissions: PlatformPermission[]
  /** Which /[country] URLs the user may open; see canUseCountry(). */
  countryAccess: CountryAccess
  /** Sources that failed, so clients can tell them from empty results. */
  unavailable: OptionalOverviewSource[]
}
