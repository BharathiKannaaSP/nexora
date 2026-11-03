import type {
  AdminAccessRequestStatus,
  Onboarding,
  OnboardingPath,
} from "@nexora/shared/types/onboarding"

export type ReviewOutcome = "waiting" | "inReview" | "approved" | "rejected"

export type ReviewStage =
  "submitted" | "inReview" | "underApproval" | "completed"

export type ReviewStageState = "done" | "current" | "pending" | "rejected"

export const reviewStages = [
  "submitted",
  "inReview",
  "underApproval",
  "completed",
] as const satisfies readonly ReviewStage[]

// Labels live in onboarding.json under chooseYourPathForm.paths.
export const PATH_KEYS = {
  BECOME_ADMIN: "becomeAdmin",
  CREATE_ORGANIZATION: "createOrganization",
  JOIN_ORGANIZATION: "joinOrganization",
} as const satisfies Record<OnboardingPath, string>

/**
 * Where the submission stands. A rejection on either record wins; otherwise
 * the path's request, when it has one, says how far the review has got.
 */
export const reviewOutcome = (
  onboarding: Onboarding | null,
  requestStatus: AdminAccessRequestStatus | null
): ReviewOutcome => {
  if (onboarding?.status === "REJECTED" || requestStatus === "REJECTED") {
    return "rejected"
  }
  if (requestStatus === "APPROVED") return "approved"
  if (requestStatus === "UNDER_REVIEW") return "inReview"
  return "waiting"
}

/** The stage each outcome is on; the ones before it are done. */
const currentStageIndex: Record<ReviewOutcome, number> = {
  waiting: 1,
  inReview: 2,
  rejected: 2,
  approved: 3,
}

export const reviewStageState = (
  outcome: ReviewOutcome,
  index: number
): ReviewStageState => {
  const current = currentStageIndex[outcome]
  if (index < current) return "done"
  if (index > current) return "pending"
  return outcome === "rejected" ? "rejected" : "current"
}
