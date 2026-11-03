import type {
  OnboardingPath,
  OnboardingStatus,
  OnboardingStep,
} from "@nexora/shared/types/onboarding"
import type { Temporal } from "temporal-polyfill"
import { db } from "../prisma/onboarding-db"

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
  moduleCode: string
  accessLevel: string
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
    }).update({ currentStep: "REVIEW" })

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

    return {
      onboarding: movedOn,
      adminAccessRequest: { ...saved, requestedPermissions },
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

/** Permission rows of the user's APPROVED admin access requests. */
export const getApprovedPermissionRowsRepository = async (
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
