import {
  USER_ONBOARDING_STEPS,
  type UpdateOnboardingStepInput,
} from "@nexora/schemas/onboarding/update-step"
import {
  PERMISSION_MODULES,
  type BecomeAdminRequestInput,
} from "@nexora/schemas/onboarding/become-admin"
import { AppError } from "@nexora/shared/express/app-error"
import type {
  BecomeAdminFormDetailsResponseData,
  GrantedPermissionsResponseData,
  BecomeAdminRequestResponseData,
  OnboardingMeResponseData,
  OnboardingStatus,
  OnboardingStep,
  UpdateOnboardingStepResponseData,
} from "@nexora/shared/types/onboarding"
import { Temporal } from "temporal-polyfill"
import {
  initiateUserOnboarding,
  getOnboardingDetailRepository,
  saveAdminAccessRequestRepository,
  updateOnboardingStepRepository,
  getAdminAccessRequestFormDetailsRepository,
  getApprovedPermissionRowsRepository,
} from "./onboarding-repository"

// Submitted, rejected and completed onboardings are only changed by review.
const EDITABLE_STATUSES: readonly OnboardingStatus[] = [
  "PENDING",
  "IN_PROGRESS",
]

// Step 3 has one page per path, so it and everything after need one chosen.
const STEPS_NEEDING_PATH: readonly OnboardingStep[] = [
  "ROLE_REQUIREMENTS",
  "REVIEW",
]

const stepIndex = (step: OnboardingStep) =>
  (USER_ONBOARDING_STEPS as readonly OnboardingStep[]).indexOf(step)

export const initiateForUserOnboarding = async (userId: string) => {
  const created = await initiateUserOnboarding(userId)
  return { userId, created }
}

export const getOnboardingDetailsService = async (
  userId: string
): Promise<OnboardingMeResponseData> => {
  const onboarding = await getOnboardingDetailRepository(userId)
  return { onboarding: onboarding ?? null }
}

/**
 * Moves to the next step or back to any earlier one. Skipping ahead is
 * rejected, so finishing a step is the only way past it.
 */
export const updateOnboardingStepService = async (
  userId: string,
  { step, selectedPath }: UpdateOnboardingStepInput
): Promise<UpdateOnboardingStepResponseData> => {
  const onboarding = await getOnboardingDetailRepository(userId)

  // onboarding-service creates the record when it consumes the sign-up
  // event, so a brand-new account may not have one yet.
  if (!onboarding) {
    throw new AppError("Onboarding not found", 404, "ONBOARDING_NOT_FOUND")
  }

  const currentIndex = stepIndex(onboarding.currentStep)

  if (!EDITABLE_STATUSES.includes(onboarding.status) || currentIndex === -1) {
    throw new AppError(
      "Onboarding can no longer be changed",
      409,
      "ONBOARDING_LOCKED"
    )
  }

  if (stepIndex(step) > currentIndex + 1) {
    throw new AppError(
      "Onboarding steps can't be skipped",
      400,
      "ONBOARDING_STEP_SKIPPED"
    )
  }

  // A path sent with this request counts, so choosing one and moving past
  // CHOOSE_PATH can happen in one call.
  if (
    STEPS_NEEDING_PATH.includes(step) &&
    !(selectedPath ?? onboarding.selectedPath)
  ) {
    throw new AppError(
      "Choose a path before continuing",
      400,
      "ONBOARDING_PATH_REQUIRED"
    )
  }

  const updated = await updateOnboardingStepRepository(userId, onboarding, {
    currentStep: step,
    status: "IN_PROGRESS",
    startedAt: onboarding.startedAt ?? Temporal.Now.instant(),
    ...(selectedPath && { selectedPath }),
  })

  // Another request moved the onboarding between the checks and the write.
  if (!updated || updated.currentStep !== step) {
    throw new AppError(
      "Onboarding was changed by another request",
      409,
      "ONBOARDING_CHANGED"
    )
  }

  return { onboarding: updated }
}

/**
 * Turns { IN: { USER_MANAGEMENT: ["VIEW", "EDIT"] } } into one row per
 * country, module and action. Only the requested countries count: the form
 * keeps picks for unticked countries in case they're ticked again.
 */
const toPermissionRows = ({
  countries,
  permissions,
}: Pick<BecomeAdminRequestInput, "countries" | "permissions">) =>
  [...new Set(countries)].flatMap((countryCode) =>
    PERMISSION_MODULES.flatMap((moduleCode) =>
      [...new Set(permissions[countryCode]?.[moduleCode] ?? [])].map(
        (accessLevel) => ({ countryCode, moduleCode, accessLevel })
      )
    )
  )

export const submitBecomeAdminRequestService = async (
  userId: string,
  input: BecomeAdminRequestInput
): Promise<BecomeAdminRequestResponseData> => {
  const onboarding = await getOnboardingDetailRepository(userId)

  if (!onboarding) {
    throw new AppError("Onboarding not found", 404, "ONBOARDING_NOT_FOUND")
  }

  if (!EDITABLE_STATUSES.includes(onboarding.status)) {
    throw new AppError(
      "Onboarding can no longer be changed",
      409,
      "ONBOARDING_LOCKED"
    )
  }

  if (onboarding.selectedPath !== "BECOME_ADMIN") {
    throw new AppError(
      "Choose the become admin path first",
      400,
      "ONBOARDING_PATH_MISMATCH"
    )
  }

  if (onboarding.currentStep !== "ROLE_REQUIREMENTS") {
    throw new AppError(
      "Onboarding isn't on the role requirements step",
      409,
      "ONBOARDING_STEP_MISMATCH"
    )
  }

  const saved = await saveAdminAccessRequestRepository(
    onboarding,
    {
      jobTitle: input.jobTitle,
      department: input.department,
      currentOrganizationName: input.currentOrganizationName,
      justification: input.justification,
    },
    toPermissionRows(input)
  )

  // Another request moved the onboarding between the checks and the write.
  if (!saved) {
    throw new AppError(
      "Onboarding was changed by another request",
      409,
      "ONBOARDING_CHANGED"
    )
  }

  return saved
}

/**
 * The saved become-admin request, to prefill step 3 when the user comes back
 * to it; `adminAccessRequest` is null before the first submit.
 */
export const getBecomeAdminFormDetailsService = async (
  userId: string
): Promise<BecomeAdminFormDetailsResponseData> => {
  const onboarding = await getOnboardingDetailRepository(userId)

  if (!onboarding) {
    throw new AppError("Onboarding not found", 404, "ONBOARDING_NOT_FOUND")
  }

  if (onboarding.selectedPath !== "BECOME_ADMIN") {
    throw new AppError(
      "Choose the become admin path first",
      400,
      "ONBOARDING_PATH_MISMATCH"
    )
  }

  const adminAccessRequest =
    await getAdminAccessRequestFormDetailsRepository(onboarding)

  return { adminAccessRequest: adminAccessRequest ?? null }
}

/**
 * What the user was granted as an admin: the permissions of their APPROVED
 * requests, or none. Other services call it to authorize admin actions.
 */
export const getGrantedPermissionsService = async (
  userId: string
): Promise<GrantedPermissionsResponseData> => {
  const permissions = await getApprovedPermissionRowsRepository(userId)
  return { permissions }
}
