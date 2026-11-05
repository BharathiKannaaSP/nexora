import {
  USER_ONBOARDING_STEPS,
  type UpdateOnboardingStepInput,
} from "@nexora/schemas/onboarding/update-step"
import {
  PERMISSION_ACTIONS,
  PERMISSION_MODULES,
  type BecomeAdminRequestInput,
} from "@nexora/schemas/onboarding/become-admin"
import {
  ORGANIZATION_DOCUMENT_SLOTS,
  type CreateOrganizationRequestInput,
  type OrganizationDocumentSlot,
  type SubmittedFile,
} from "@nexora/schemas/onboarding/create-organization"
import {
  parseUploadKey,
  type UploadPurpose,
} from "@nexora/schemas/media/upload"
import {
  ORGANIZATION_PERMISSION_MODULES,
  type JoinOrganizationRequestInput,
} from "@nexora/schemas/onboarding/join-organization"
import { AppError } from "@nexora/shared/express/app-error"
import type {
  BecomeAdminFormDetailsResponseData,
  GrantedPermissionsResponseData,
  BecomeAdminRequestResponseData,
  OnboardingMeResponseData,
  OnboardingPath,
  OnboardingStatus,
  OnboardingStep,
  UpdateOnboardingStepResponseData,
  OrganizationRequestResponseData,
  CreateOrganizationFormDetailsResponseData,
} from "@nexora/shared/types/onboarding"
import { Temporal } from "temporal-polyfill"
import {
  initiateUserOnboarding,
  getOnboardingDetailRepository,
  saveAdminAccessRequestRepository,
  updateOnboardingStepRepository,
  getAdminAccessRequestFormDetailsRepository,
  saveOrganizationRequestRepository,
  type OrganizationRequestDocumentRow,
  type OrganizationRequestFields,
  type OrganizationRequestPermissionRow,
  getCreateOrganizationFormDetailsRepository,
  removeOrganizationRequestFileRepository,
  getAdminPermissionRowsRepository,
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

const blankToNull = (value: string | undefined) => value || null

// Both types' columns, null; each type fills in its own.
const EMPTY_ORGANIZATION_REQUEST: Omit<OrganizationRequestFields, "type"> = {
  organizationId: null,
  message: null,
  employeeId: null,
  jobTitle: null,
  department: null,
  workEmail: null,
  joiningDate: null,
  reportingManager: null,
  proposedName: null,
  proposedSlug: null,
  proposedDescription: null,
  proposedCountryCode: null,
  proposedIndustry: null,
  proposedSize: null,
  proposedWebsite: null,
  proposedLogoObjectKey: null,
  proposedTaxDetails: null,
  proposedAddress: null,
}

/** The creator becomes ORG_ADMIN: every action in every organization module. */
const ORG_ADMIN_PERMISSION_ROWS: OrganizationRequestPermissionRow[] =
  ORGANIZATION_PERMISSION_MODULES.flatMap((moduleCode) =>
    PERMISSION_ACTIONS.map((accessLevel) => ({ moduleCode, accessLevel }))
  )

const toCreateOrganizationRequest = (
  input: CreateOrganizationRequestInput
): OrganizationRequestFields => ({
  ...EMPTY_ORGANIZATION_REQUEST,
  type: "CREATE",
  proposedName: input.proposedName,
  proposedSlug: input.proposedSlug,
  proposedDescription: input.proposedDescription,
  proposedCountryCode: input.proposedCountryCode,
  proposedIndustry: input.proposedIndustry,
  proposedSize: input.proposedSize,
  proposedWebsite: blankToNull(input.proposedWebsite),
  proposedLogoObjectKey: input.proposedLogoKey,
  proposedTaxDetails: input.proposedTaxDetails,
  proposedAddress: input.proposedAddress,
})

const invalidFile = () =>
  new AppError(
    "A file wasn't uploaded by you for this field; upload it again",
    400,
    "ONBOARDING.ORGANIZATION_FILE_INVALID"
  )

/**
 * Checks the logo and document keys without calling media-service: the key
 * says who uploaded the file and what for (see parseUploadKey). Returns the
 * document rows to save.
 */
const toOrganizationDocumentRows = (
  userId: string,
  input: CreateOrganizationRequestInput
): OrganizationRequestDocumentRow[] => {
  const assertUploadedBy = (key: string, purpose: UploadPurpose) => {
    const upload = parseUploadKey(key)
    if (upload?.userId !== userId || upload.purpose !== purpose) {
      throw invalidFile()
    }
  }

  const slots = Object.entries(input.proposedDocuments).filter(
    (entry): entry is [OrganizationDocumentSlot, SubmittedFile] => !!entry[1]
  )

  assertUploadedBy(input.proposedLogoKey, "org-logo")
  slots.forEach(([, file]) => assertUploadedBy(file.key, "org-document"))

  const keys = [input.proposedLogoKey, ...slots.map(([, file]) => file.key)]
  if (new Set(keys).size !== keys.length) {
    throw new AppError(
      "Each file can be used only once",
      400,
      "ONBOARDING.ORGANIZATION_FILE_DUPLICATE"
    )
  }

  return slots.map(([slot, file]) => ({
    documentType: ORGANIZATION_DOCUMENT_SLOTS[slot],
    objectKey: file.key,
    originalFileName: file.originalFileName,
    contentType: file.contentType,
    sizeBytes: file.sizeBytes,
  }))
}

const toJoinOrganizationRequest = (
  input: JoinOrganizationRequestInput
): OrganizationRequestFields => ({
  ...EMPTY_ORGANIZATION_REQUEST,
  type: "JOIN",
  organizationId: input.organizationId,
  message: blankToNull(input.message),
  employeeId: blankToNull(input.employeeId),
  jobTitle: input.jobTitle,
  department: blankToNull(input.department),
  workEmail: blankToNull(input.workEmail),
  // A calendar date, stored as midnight UTC.
  joiningDate: input.joiningDate
    ? Temporal.PlainDate.from(input.joiningDate)
        .toZonedDateTime("UTC")
        .toInstant()
    : null,
  reportingManager: blankToNull(input.reportingManager),
})

/** { PRODUCT_MANAGEMENT: ["VIEW", "EDIT"] } → one row per module and action. */
const toJoinPermissionRows = ({
  permissions,
}: JoinOrganizationRequestInput): OrganizationRequestPermissionRow[] =>
  ORGANIZATION_PERMISSION_MODULES.flatMap((moduleCode) =>
    [...new Set(permissions[moduleCode] ?? [])].map((accessLevel) => ({
      moduleCode,
      accessLevel,
    }))
  )

const PATH_FOR_REQUEST_TYPE = {
  CREATE: "CREATE_ORGANIZATION",
  JOIN: "JOIN_ORGANIZATION",
} as const satisfies Record<OrganizationRequestFields["type"], OnboardingPath>

/**
 * Step 3 of the CREATE_ORGANIZATION and JOIN_ORGANIZATION paths. A creator
 * asks for nothing and gets every organization permission; a member picks
 * the modules and actions they need.
 */
export const submitOrganizationRequestService = async (
  userId: string,
  input: CreateOrganizationRequestInput | JoinOrganizationRequestInput
): Promise<OrganizationRequestResponseData> => {
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

  if (onboarding.selectedPath !== PATH_FOR_REQUEST_TYPE[input.type]) {
    throw new AppError(
      input.type === "CREATE"
        ? "Choose the create organization path first"
        : "Choose the join organization path first",
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

  const saved =
    input.type === "CREATE"
      ? await saveOrganizationRequestRepository(
          onboarding,
          toCreateOrganizationRequest(input),
          ORG_ADMIN_PERMISSION_ROWS,
          toOrganizationDocumentRows(userId, input)
        )
      : await saveOrganizationRequestRepository(
          onboarding,
          toJoinOrganizationRequest(input),
          toJoinPermissionRows(input),
          []
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

export const getCreateOrganizationFormDetailsService = async (
  userId: string
): Promise<CreateOrganizationFormDetailsResponseData> => {
  const onboarding = await getOnboardingDetailRepository(userId)

  if (!onboarding) {
    throw new AppError("Onboarding not found", 404, "ONBOARDING_NOT_FOUND")
  }

  if (onboarding.selectedPath !== "CREATE_ORGANIZATION") {
    throw new AppError(
      "Choose the create organization path first",
      400,
      "ONBOARDING_PATH_MISMATCH"
    )
  }

  const createOrganizationFormDetails =
    await getCreateOrganizationFormDetailsRepository(onboarding)

  return {
    createOrganizationFormDetails: createOrganizationFormDetails ?? null,
  }
}

/**
 * Step 3 of CREATE_ORGANIZATION: the user deleted a saved logo or document.
 * It's taken off the saved request here, before the app deletes the object
 * from S3, so the request never points at a missing file. The user has to
 * submit again (with a new file where one is required) to move on.
 */
export const removeOrganizationRequestFileService = async (
  userId: string,
  objectKey: string
) => {
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

  if (onboarding.selectedPath !== "CREATE_ORGANIZATION") {
    throw new AppError(
      "Choose the create organization path first",
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

  if (parseUploadKey(objectKey)?.userId !== userId) throw invalidFile()

  // Not on the request (e.g. already removed) is fine: the file is gone
  // from it either way.
  await removeOrganizationRequestFileRepository(onboarding, objectKey)

  return { objectKey }
}

/**
 * What the user was granted as an admin: the permissions of their APPROVED
 * requests, or none. Other services call it to authorize admin actions.
 */
export const getAdminPermissionsService = async (
  userId: string
): Promise<GrantedPermissionsResponseData> => {
  const permissions = await getAdminPermissionRowsRepository(userId)
  return { permissions }
}
