import type { CurrentUserOverviewResponseData } from "@nexora/shared/types/aggregate"
import type { SystemRole } from "@nexora/shared/types/auth"
import type {
  Onboarding,
  OnboardingPath,
  OnboardingStep,
} from "@nexora/shared/types/onboarding"

/** Where an onboarded user belongs; every other page is gated until then. */
export const DASHBOARD_PATH = "/"

export const VERIFY_EMAIL_PATH = "/auth/verify-email"

/** Only these roles may reach the dashboard. */
export const DASHBOARD_ROLES = [
  "ADMIN",
  "ORG_ADMIN",
  "ORG_MEMBER",
] as const satisfies SystemRole[]

export const hasDashboardAccess = (systemRole: SystemRole) =>
  (DASHBOARD_ROLES as readonly SystemRole[]).includes(systemRole)

/** Step 3 has one page per path chosen in step 2. */
export const ROLE_REQUIREMENTS_PATHS = {
  BECOME_ADMIN: "/onboarding/become-admin",
  CREATE_ORGANIZATION: "/onboarding/create-organization",
  JOIN_ORGANIZATION: "/onboarding/join-organization",
} as const satisfies Record<OnboardingPath, string>

export const ONBOARDING_PATHS = {
  BASIC_INFORMATION: "/onboarding/basic-information",
  CHOOSE_PATH: "/onboarding/choose-path",
  REVIEW: "/onboarding/review",
} as const satisfies Partial<Record<OnboardingStep, string>>

export type BootstrapPath =
  | typeof DASHBOARD_PATH
  | typeof VERIFY_EMAIL_PATH
  | (typeof ONBOARDING_PATHS)[keyof typeof ONBOARDING_PATHS]
  | (typeof ROLE_REQUIREMENTS_PATHS)[keyof typeof ROLE_REQUIREMENTS_PATHS]

const onboardingPath = (onboarding: Onboarding | null): BootstrapPath => {
  // onboarding-service creates the record when it consumes the sign-up
  // event, so a brand-new account may not have one yet. Either way the user
  // starts at step 1.
  if (!onboarding) return ONBOARDING_PATHS.BASIC_INFORMATION

  // Submitted or rejected onboardings stay on review, which shows the
  // outcome, until an approval marks them completed.
  if (onboarding.status === "COMPLETED") return DASHBOARD_PATH
  if (
    onboarding.status === "WAITING_APPROVAL" ||
    onboarding.status === "REJECTED"
  ) {
    return ONBOARDING_PATHS.REVIEW
  }

  switch (onboarding.currentStep) {
    case "BASIC_INFORMATION":
      return ONBOARDING_PATHS.BASIC_INFORMATION
    case "CHOOSE_PATH":
      return ONBOARDING_PATHS.CHOOSE_PATH
    case "ROLE_REQUIREMENTS":
      // Without a chosen path there's no step-3 page to show.
      return onboarding.selectedPath
        ? ROLE_REQUIREMENTS_PATHS[onboarding.selectedPath]
        : ONBOARDING_PATHS.CHOOSE_PATH
    case "REVIEW":
      return ONBOARDING_PATHS.REVIEW
    case "COMPLETED":
      return DASHBOARD_PATH
  }
}

/**
 * The one page, relative to /[country]/[lang], the signed-in user may be on:
 * verify the email first, then finish onboarding step by step, then the
 * dashboard, which also needs one of DASHBOARD_ROLES. Callers check
 * `unavailable` first, since a failed onboarding lookup also comes back as
 * `onboarding: null`.
 */
export const resolveBootstrapPath = ({
  account,
  onboarding,
}: Pick<
  CurrentUserOverviewResponseData,
  "account" | "onboarding"
>): BootstrapPath => {
  if (!account.isEmailVerified) return VERIFY_EMAIL_PATH

  const path = onboardingPath(onboarding)
  // A finished onboarding without a dashboard role (USER, GUEST) waits on
  // review until an approval grants one.
  if (path === DASHBOARD_PATH && !hasDashboardAccess(account.systemRole)) {
    return ONBOARDING_PATHS.REVIEW
  }
  return path
}
