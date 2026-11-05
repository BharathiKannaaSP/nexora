// `data` of onboarding-service responses, as they arrive over JSON:
// timestamps are ISO 8601 strings.

/**
 * The saved CREATE request of the current revision, to prefill step 3 of the
 * CREATE_ORGANIZATION path when the user comes back to it.
 *
 * `proposedDocuments` carry everything a resubmit sends again for a file the
 * user keeps (`objectKey`, `originalFileName`, `contentType`, `sizeBytes`);
 * `documentType` maps back to the form slot via ORGANIZATION_DOCUMENT_SLOTS.
 */
export type CreateOrganizationFormDetails = Pick<
  OrganizationRequest,
  | "id"
  | "status"
  | "applicationRevision"
  | "proposedName"
  | "proposedSlug"
  | "proposedDescription"
  | "proposedCountryCode"
  | "proposedIndustry"
  | "proposedSize"
  | "proposedWebsite"
  | "proposedLogoObjectKey"
  | "proposedTaxDetails"
  | "proposedAddress"
  | "proposedDocuments"
  | "submittedAt"
  | "updatedAt"
>

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
 * GET /onboarding/create-organization-form-details. `null` until step 3 of
 * the CREATE_ORGANIZATION path has been submitted.
 */
export interface CreateOrganizationFormDetailsResponseData {
  createOrganizationFormDetails: CreateOrganizationFormDetails | null
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

/** A JSON column's value. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue }

export type OrganizationRequestType = "CREATE" | "JOIN"

export type OrganizationRequestStatus =
  "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "WITHDRAWN"

export type OrganizationDocumentType =
  | "ORGANIZATION_LOGO"
  | "TAX_DOCUMENT"
  | "BUSINESS_REGISTRATION"
  | "PROOF_OF_ADDRESS"
  | "IDENTITY_DOCUMENT"
  | "RESIDENCE_PERMIT"
  | "EMPLOYMENT_PROOF"
  | "OTHER"

export type OrganizationDocumentStatus =
  "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "REUPLOAD_REQUIRED"

/** One action in one module; the organization's country applies. */
export interface OrganizationRequestPermission {
  id: string
  requestId: string
  moduleCode: string
  accessLevel: string
  moduleNameSnapshot: string | null
  createdAt: string
}

export interface OrganizationRequestDocument {
  id: string
  requestId: string
  requirementId: string | null
  documentType: OrganizationDocumentType
  status: OrganizationDocumentStatus
  /** Private S3 key, not a public URL. */
  objectKey: string
  originalFileName: string
  contentType: string
  sizeBytes: number
  checksumSha256: string | null
  reviewedByUserId: string | null
  reviewedAt: string | null
  reviewComment: string | null
  createdAt: string
  updatedAt: string
}

export interface OrganizationRequest {
  id: string
  onboardingId: string
  userId: string
  /** JOIN: the organization being joined. CREATE: null until it is created. */
  organizationId: string | null
  type: OrganizationRequestType
  status: OrganizationRequestStatus

  // For joining an existing organization.
  message: string | null
  employeeId: string | null
  jobTitle: string | null
  department: string | null
  workEmail: string | null
  joiningDate: string | null
  reportingManager: string | null

  // For creating an organization.
  proposedName: string | null
  proposedSlug: string | null
  proposedDescription: string | null
  proposedCountryCode: string | null
  // Plain String and Json columns: the database doesn't narrow them, so
  // readers check the values (see the create-organization form's defaults).
  proposedIndustry: string | null
  proposedSize: string | null
  proposedWebsite: string | null
  proposedLogoObjectKey: string | null

  // Country-specific fields validated by the backend.
  proposedTaxDetails: JsonValue | null
  proposedAddress: JsonValue | null

  reviewedByUserId: string | null
  reviewedAt: string | null
  reviewComment: string | null
  applicationRevision: number
  submittedAt: string
  updatedAt: string

  proposedDocuments: OrganizationRequestDocument[]
  /**
   * JOIN: the modules and actions the member asked for. CREATE: every
   * organization permission, since the creator becomes ORG_ADMIN.
   */
  requestedPermissions: OrganizationRequestPermission[]
}

export interface OrganizationRequestResponseData {
  onboarding: Onboarding
  organizationRequest: OrganizationRequest
}
