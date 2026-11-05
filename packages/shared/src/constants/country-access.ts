// Who may use which /[country]. Shared so the admin app's redirect and
// auth-service's update check apply the same rule.

import type { Onboarding } from "../types/onboarding"

/** The steps after CHOOSE_PATH, where the user's country has been picked. */
const STEPS_AFTER_CHOOSE_PATH: readonly Onboarding["currentStep"][] = [
  "ROLE_REQUIREMENTS",
  "REVIEW",
  "COMPLETED",
]

/**
 * Whether the saved country is locked. Sign-up saves whatever /country the
 * user signed up on, and onboarding's choose-path step then moves them to
 * the country they picked. Once that step is done, the saved country is
 * locked; going back to choose-path unlocks it again.
 */
export const isCountryLocked = (onboarding: Onboarding | null): boolean => {
  if (!onboarding) return false
  if (onboarding.status !== "PENDING" && onboarding.status !== "IN_PROGRESS") {
    return true
  }
  return STEPS_AFTER_CHOOSE_PATH.includes(onboarding.currentStep)
}

export interface CountryAccess {
  /** The account's saved country, e.g. "in". */
  savedCountry: string
  locked: boolean
  /** Countries the user holds any platform permission in, lowercase. */
  permittedCountries: readonly string[]
}

/**
 * Whether the user may use `country` (any case): their saved one always,
 * any country while it isn't locked yet, and otherwise only countries they
 * hold a platform permission in.
 */
export const canUseCountry = (
  { savedCountry, locked, permittedCountries }: CountryAccess,
  country: string
): boolean => {
  const target = country.toLowerCase()
  return (
    !locked ||
    target === savedCountry.toLowerCase() ||
    permittedCountries.some((c) => c.toLowerCase() === target)
  )
}
