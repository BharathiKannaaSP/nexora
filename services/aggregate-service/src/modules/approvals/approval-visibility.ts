import {
  APPROVAL_REQUEST_TYPES,
  REVIEWER_ACCESS_LEVEL,
  REVIEWER_MODULE,
  type ApprovalRequestType,
} from "@nexora/schemas/onboarding/approvals"
import type { UserPermissionsResponseData } from "@nexora/shared/types/user"

import { fetchFromService } from "../../clients/service-client"

/** The countries, uppercase, where the caller reviews each request type. */
export type ReviewedCountries = Record<ApprovalRequestType, Set<string>>

/**
 * Where the caller reviews each type, from their platform permissions (an
 * organization's permissions never make anyone a reviewer). Null when the
 * lookup failed: callers then apply only the strict rule below.
 */
export const fetchReviewedCountries = async (
  userId: string
): Promise<ReviewedCountries | null> => {
  try {
    const { permissions } = await fetchFromService<UserPermissionsResponseData>(
      "user",
      "/api/v1/user/permissions",
      userId
    )

    return Object.fromEntries(
      APPROVAL_REQUEST_TYPES.map((type) => [
        type,
        new Set(
          permissions
            .filter(
              (p) =>
                p.moduleCode === REVIEWER_MODULE[type] &&
                p.accessLevel === REVIEWER_ACCESS_LEVEL
            )
            .map((p) => p.countryCode.toUpperCase())
        ),
      ])
    ) as ReviewedCountries
  } catch (error) {
    console.error("Aggregate service: permissions lookup failed", error)
    return null
  }
}

/**
 * Whether a request belongs on the /[country] pages (list and detail alike,
 * so the two can't disagree). `country` and `countryCodes` are uppercase.
 *
 * - It's for `country`: yes. (The page itself still needs the caller to
 *   review the type there.)
 * - No known country (a JOIN whose organization can't be looked up): no.
 * - It's for countries the caller doesn't review at all (one no one
 *   managed yet, assigned to them anyway; see request-assignment.ts): it
 *   has no page of its own they can open, so it shows under every country
 *   where they review its type.
 * - Otherwise (e.g. an IN/BR request opened under /us by a reviewer of IN):
 *   no, it belongs under its own countries.
 */
export const isVisibleInCountry = (
  { type, countryCodes }: { type: ApprovalRequestType; countryCodes: string[] },
  country: string,
  reviewed: ReviewedCountries | null
) => {
  if (countryCodes.includes(country)) return true
  if (countryCodes.length === 0 || !reviewed) return false
  const mine = reviewed[type]
  return mine.has(country) && !countryCodes.some((code) => mine.has(code))
}
