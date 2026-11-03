// `data` of onboarding-service responses, as they arrive over JSON:
// timestamps are ISO 8601 strings.

export type OnboardingStatus =
  "PENDING" | "IN_PROGRESS" | "WAITING_APPROVAL" | "COMPLETED" | "REJECTED"

export type OnboardingStep =
  | "BASIC_INFORMATION"
  | "CHOOSE_PATH"
  | "ROLE_REQUIREMENTS"
  | "REVIEW"
  | "COMPLETED"

export type OnboardingPath =
  "BECOME_ADMIN" | "CREATE_ORGANIZATION" | "JOIN_ORGANIZATION"

export interface Onboarding {
  id: string
  userId: string
  status: OnboardingStatus
  currentStep: OnboardingStep
  selectedPath: OnboardingPath | null
  startedAt: string | null
  submittedAt: string | null
  completedAt: string | null
  rejectedAt: string | null
  rejectionReason: string | null
  revision: number
  createdAt: string
  updatedAt: string
}

/** GET /onboarding/onboardingDetails. `null` until the user's onboarding has been created. */
export interface OnboardingMeResponseData {
  onboarding: Onboarding | null
}

/** PATCH /onboarding/step */
export interface UpdateOnboardingStepResponseData {
  onboarding: Onboarding
}

export type AdminAccessRequestStatus =
  "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "WITHDRAWN"

/** One action in one module for one country, e.g. IN · USER_MANAGEMENT · EDIT. */
export interface AdminAccessRequestPermission {
  id: string
  requestId: string
  countryCode: string
  moduleCode: string
  accessLevel: string
  moduleNameSnapshot: string | null
  createdAt: string
}

export interface AdminAccessRequest {
  id: string
  onboardingId: string
  userId: string
  status: AdminAccessRequestStatus
  justification: string
  jobTitle: string
  department: string
  currentOrganizationName: string
  reviewedByUserId: string | null
  reviewedAt: string | null
  reviewComment: string | null
  applicationRevision: number
  submittedAt: string
  updatedAt: string
  requestedPermissions: AdminAccessRequestPermission[]
}

/** POST /onboarding/become-admin-request */
export interface BecomeAdminRequestResponseData {
  onboarding: Onboarding
  adminAccessRequest: AdminAccessRequest
}

/**
 * GET /onboarding/become-admin-request-details. `null` until step 3 of the
 * BECOME_ADMIN path has been submitted.
 */
export interface BecomeAdminFormDetailsResponseData {
  adminAccessRequest: AdminAccessRequest | null
}

/** GET /onboarding/granted-permissions: rows of APPROVED requests only. */
export interface GrantedPermissionsResponseData {
  permissions: Pick<
    AdminAccessRequestPermission,
    "countryCode" | "moduleCode" | "accessLevel"
  >[]
}
