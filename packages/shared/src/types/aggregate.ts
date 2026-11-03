// `data` of aggregate-service responses.

import type { CurrentUser } from "./auth"
import type { Onboarding } from "./onboarding"
import type { UserDetailsResponseData } from "./user"

/** Sources the overview can do without; auth failing fails the request. */
export type OptionalOverviewSource = "user" | "onboarding"

/** GET /aggregate/me */
export interface CurrentUserOverviewResponseData {
  account: CurrentUser
  user: UserDetailsResponseData | null
  onboarding: Onboarding | null
  /** Sources that failed, so clients can tell them from empty results. */
  unavailable: OptionalOverviewSource[]
}
