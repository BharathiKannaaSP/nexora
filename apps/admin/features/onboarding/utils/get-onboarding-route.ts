type OnboardingStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "WAITING_APPROVAL"
  | "COMPLETED"
  | "REJECTED"

type OnboardingStep =
  | "BASIC_INFORMATION"
  | "CHOOSE_PATH"
  | "ROLE_REQUIREMENTS"
  | "COMPLETED"

interface GetOnboardingRouteParams {
  status: OnboardingStatus
  currentStep: OnboardingStep
}

export const getOnboardingRoute = ({
  status,
  currentStep,
}: GetOnboardingRouteParams): string => {
  if (status === "COMPLETED") {
    return "/dashboard"
  }

  if (status === "WAITING_APPROVAL") {
    return "/onboarding/waiting-approval"
  }

  if (status === "REJECTED") {
    return "/onboarding/rejected"
  }

  switch (currentStep) {
    case "BASIC_INFORMATION":
      return "/onboarding/basic-information"

    case "CHOOSE_PATH":
      return "/onboarding/choose-path"

    case "ROLE_REQUIREMENTS":
      return "/onboarding/role-requirements"

    case "COMPLETED":
      return "/dashboard"

    default:
      return "/onboarding/basic-information"
  }
}
