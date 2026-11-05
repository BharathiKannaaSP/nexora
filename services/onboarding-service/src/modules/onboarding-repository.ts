import type {
  JsonValue,
  OnboardingPath,
  OnboardingStatus,
  OnboardingStep,
  OrganizationDocumentType,
} from "@nexora/shared/types/onboarding"
import type {
  PermissionAction,
  PermissionModuleCode,
} from "@nexora/schemas/onboarding/become-admin"
import { Temporal } from "temporal-polyfill"
import { db } from "../prisma/onboarding-db"
import { approveFirstAdminRequest, assignReviewer } from "./request-assignment"

export const initiateUserOnboarding = async (
  userId: string
): Promise<boolean> => {
  return db.transaction(async (tx) => {
    const existing = await tx.orm.public.Onboarding.where({ userId }).first()

    if (existing) {
      return false
    }

    await tx.orm.public.Onboarding.create({
      userId,
      status: "PENDING",
      currentStep: "BASIC_INFORMATION",
      revision: 1,
    })

    return true
  })
}

export interface AdminAccessRequestPermissionRow {
  countryCode: string
  moduleCode: PermissionModuleCode
  accessLevel: PermissionAction
}

export const getOnboardingDetailRepository = async (userId: string) => {
  const onboardingDetail = await db.orm.public.Onboarding.where({
    userId,
  }).first()
  return onboardingDetail
}

/**
 * Moves the onboarding to `changes.currentStep`, and to `changes.selectedPath`
 * when given, but only while it is still at `from`: a concurrent change makes
 * this a no-op, which the caller sees in the returned row.
 */
export const updateOnboardingStepRepository = async (
  userId: string,
  from: { currentStep: OnboardingStep; status: OnboardingStatus },
  changes: {
    currentStep: OnboardingStep
    status: OnboardingStatus
    startedAt: Temporal.Instant
    selectedPath?: OnboardingPath
  }
) => {
  return db.transaction(async (tx) => {
    await tx.orm.public.Onboarding.where({
      userId,
      currentStep: from.currentStep,
      status: from.status,
    }).update(changes)

    return tx.orm.public.Onboarding.where({ userId }).first()
  })
}

/**
 * Saves the become-admin request for the onboarding's current revision and
 * moves the onboarding on to REVIEW, all in one transaction. Coming back to
 * step 3 and submitting again replaces that revision's request and its
 * permissions. Returns null, writing nothing, when the onboarding moved away
 * from `from` in the meantime.
 */
export const saveAdminAccessRequestRepository = async (
  onboarding: {
    id: string
    userId: string
    revision: number
    currentStep: OnboardingStep
    status: OnboardingStatus
  },
  request: {
    jobTitle: string
    department: string
    currentOrganizationName: string
    justification: string
  },
  permissions: AdminAccessRequestPermissionRow[]
) => {
  return db.transaction(async (tx) => {
    const movedOn = await tx.orm.public.Onboarding.where({
      id: onboarding.id,
      currentStep: onboarding.currentStep,
      status: onboarding.status,
    }).update({ currentStep: "REVIEW", submittedAt: Temporal.Now.instant() })

    // Another request changed the onboarding first; nothing to roll back.
    if (!movedOn) return null

    const existing = await tx.orm.public.AdminAccessRequest.where({
      onboardingId: onboarding.id,
      applicationRevision: onboarding.revision,
    }).first()

    const saved = existing
      ? await tx.orm.public.AdminAccessRequest.where({
          id: existing.id,
        }).update({ ...request, status: "PENDING" })
      : await tx.orm.public.AdminAccessRequest.create({
          ...request,
          onboardingId: onboarding.id,
          userId: onboarding.userId,
          applicationRevision: onboarding.revision,
        })

    if (!saved) {
      throw new Error("Admin access request disappeared mid-transaction")
    }

    if (existing) {
      await tx.orm.public.AdminAccessRequestPermission.where({
        requestId: saved.id,
      }).deleteAndCount()
    }

    const requestedPermissions = []
    for (const permission of permissions) {
      requestedPermissions.push(
        await tx.orm.public.AdminAccessRequestPermission.create({
          ...permission,
          requestId: saved.id,
        })
      )
    }

    const assignment = await assignReviewer(tx, {
      requestId: saved.id,
      requestType: "ADMIN_ACCESS",
      // Every country access is asked for in.
      countryCodes: permissions.map(({ countryCode }) => countryCode),
      requesterUserId: onboarding.userId,
    })

    // No one can review it: the very first admin is approved by the system.
    const firstAdmin = assignment
      ? null
      : await approveFirstAdminRequest(tx, {
          onboardingId: onboarding.id,
          request: saved,
          permissions: requestedPermissions,
        })

    return {
      onboarding: firstAdmin?.onboarding ?? movedOn,
      adminAccessRequest: {
        ...(firstAdmin?.request ?? saved),
        requestedPermissions,
      },
    }
  })
}

export interface OrganizationRequestPermissionRow {
  moduleCode: PermissionModuleCode
  accessLevel: PermissionAction
}

/**
 * Every column of an organization request a submit writes. The fields of the
 * other type are null, so switching between CREATE and JOIN on the same
 * revision leaves nothing of the old one behind.
 */
export interface OrganizationRequestFields {
  type: "CREATE" | "JOIN"
  organizationId: string | null

  message: string | null
  employeeId: string | null
  jobTitle: string | null
  department: string | null
  workEmail: string | null
  joiningDate: Temporal.Instant | null
  reportingManager: string | null

  proposedName: string | null
  proposedSlug: string | null
  proposedDescription: string | null
  proposedCountryCode: string | null
  proposedIndustry: string | null
  proposedSize: string | null
  proposedWebsite: string | null
  /** private/uploads/... key of the logo; CREATE only. */
  proposedLogoObjectKey: string | null
  proposedTaxDetails: JsonValue | null
  proposedAddress: JsonValue | null
}

/** One OrganizationRequestDocument row a submit writes. */
export interface OrganizationRequestDocumentRow {
  documentType: OrganizationDocumentType
  objectKey: string
  originalFileName: string
  contentType: string
  sizeBytes: number
}

/**
 * Saves the create/join organization request for the onboarding's current
 * revision, with its permissions and documents, and moves the onboarding on
 * to REVIEW, all in one transaction. Submitting again replaces that
 * revision's request, permissions and documents.
 *
 * Returns null, writing nothing, when the onboarding moved away from
 * `onboarding.currentStep`/`status` in the meantime.
 */
export const saveOrganizationRequestRepository = async (
  onboarding: {
    id: string
    userId: string
    revision: number
    currentStep: OnboardingStep
    status: OnboardingStatus
  },
  request: OrganizationRequestFields,
  permissions: OrganizationRequestPermissionRow[],
  documents: OrganizationRequestDocumentRow[]
) => {
  return db.transaction(async (tx) => {
    const movedOn = await tx.orm.public.Onboarding.where({
      id: onboarding.id,
      currentStep: onboarding.currentStep,
      status: onboarding.status,
    }).update({ currentStep: "REVIEW", submittedAt: Temporal.Now.instant() })

    // Another request changed the onboarding first; nothing to roll back.
    if (!movedOn) return null

    const existing = await tx.orm.public.OrganizationRequest.where({
      onboardingId: onboarding.id,
      applicationRevision: onboarding.revision,
    }).first()

    const saved = existing
      ? await tx.orm.public.OrganizationRequest.where({
          id: existing.id,
        }).update({ ...request, status: "PENDING" })
      : await tx.orm.public.OrganizationRequest.create({
          ...request,
          onboardingId: onboarding.id,
          userId: onboarding.userId,
          applicationRevision: onboarding.revision,
        })

    if (!saved) {
      throw new Error("Organization request disappeared mid-transaction")
    }

    if (existing) {
      await tx.orm.public.OrganizationRequestPermission.where({
        requestId: saved.id,
      }).deleteAndCount()
    }

    const requestedPermissions = []
    for (const permission of permissions) {
      requestedPermissions.push(
        await tx.orm.public.OrganizationRequestPermission.create({
          ...permission,
          requestId: saved.id,
        })
      )
    }

    // Replaced like the permissions. A JOIN passes none, so switching from
    // CREATE leaves no documents behind.
    if (existing) {
      await tx.orm.public.OrganizationRequestDocument.where({
        requestId: saved.id,
      }).deleteAndCount()
    }

    const proposedDocuments = []
    for (const document of documents) {
      proposedDocuments.push(
        await tx.orm.public.OrganizationRequestDocument.create({
          ...document,
          requestId: saved.id,
        })
      )
    }

    await assignReviewer(tx, {
      requestId: saved.id,
      requestType: request.type === "CREATE" ? "CREATE_ORG" : "JOIN_ORG",
      // CREATE: the new organization's country. JOIN: the organization's
      // country lives in organization-service, so any country for now.
      countryCodes:
        request.type === "CREATE" && request.proposedCountryCode
          ? [request.proposedCountryCode]
          : [],
      requesterUserId: onboarding.userId,
    })

    return {
      onboarding: movedOn,
      organizationRequest: {
        ...saved,
        proposedDocuments,
        requestedPermissions,
      },
    }
  })
}

export const getAdminAccessRequestFormDetailsRepository = async (onboarding: {
  id: string
  userId: string
  revision: number
  currentStep: OnboardingStep
  status: OnboardingStatus
}) => {
  return db.transaction(async (tx) => {
    const formDetails = await tx.orm.public.AdminAccessRequest.where({
      onboardingId: onboarding.id,
      applicationRevision: onboarding.revision,
    }).first()

    if (!formDetails) return null

    const requestedPermissions =
      await tx.orm.public.AdminAccessRequestPermission.where({
        requestId: formDetails.id,
      }).all()

    return { ...formDetails, requestedPermissions }
  })
}

/**
 * The CREATE request of the onboarding's current revision, with its
 * documents, to prefill step 3; null before the first submit. A JOIN request
 * on the same revision (the user switched paths) doesn't count.
 */
export const getCreateOrganizationFormDetailsRepository = async (onboarding: {
  id: string
  userId: string
  revision: number
  currentStep: OnboardingStep
  status: OnboardingStatus
}) => {
  return db.transaction(async (tx) => {
    const formDetails = await tx.orm.public.OrganizationRequest.where({
      onboardingId: onboarding.id,
      applicationRevision: onboarding.revision,
      type: "CREATE",
    }).first()

    if (!formDetails) return null

    const proposedDocuments =
      await tx.orm.public.OrganizationRequestDocument.where({
        requestId: formDetails.id,
      }).all()

    return { ...formDetails, proposedDocuments }
  })
}

/**
 * Takes one file off the saved create-organization request: clears the logo
 * key, or deletes the document row with that key. Returns what was removed,
 * or null when the request doesn't use the key (or there's no request).
 */
export const removeOrganizationRequestFileRepository = async (
  onboarding: { id: string; revision: number },
  objectKey: string
): Promise<"logo" | "document" | null> => {
  return db.transaction(async (tx) => {
    const request = await tx.orm.public.OrganizationRequest.where({
      onboardingId: onboarding.id,
      applicationRevision: onboarding.revision,
      type: "CREATE",
    }).first()

    if (!request) return null

    if (request.proposedLogoObjectKey === objectKey) {
      await tx.orm.public.OrganizationRequest.where({ id: request.id }).update({
        proposedLogoObjectKey: null,
      })
      return "logo"
    }

    const deleted = await tx.orm.public.OrganizationRequestDocument.where({
      requestId: request.id,
      objectKey,
    }).deleteAndCount()

    return deleted ? "document" : null
  })
}

/** Permission rows of the user's APPROVED admin access requests. */
export const getAdminPermissionRowsRepository = async (
  userId: string
): Promise<AdminAccessRequestPermissionRow[]> => {
  return db.transaction(async (tx) => {
    const approved = await tx.orm.public.AdminAccessRequest.where({
      userId,
      status: "APPROVED",
    }).all()

    const rows: AdminAccessRequestPermissionRow[] = []

    for (const request of approved) {
      const permissions =
        await tx.orm.public.AdminAccessRequestPermission.where({
          requestId: request.id,
        }).all()

      for (const { countryCode, moduleCode, accessLevel } of permissions) {
        rows.push({ countryCode, moduleCode, accessLevel })
      }
    }

    return rows
  })
}
