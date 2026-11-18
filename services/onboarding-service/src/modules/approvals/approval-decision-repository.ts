import { Temporal } from "temporal-polyfill"

import { KAFKA_TOPICS } from "@nexora/kafka"
import type { OrganizationRequestApprovedPayload } from "@nexora/schemas/events/organization"
import type { AdminAccessApprovedPayload } from "@nexora/schemas/events/permissions"
import {
  OPEN_APPROVAL_STATUSES,
  type ApprovalDecision,
} from "@nexora/schemas/onboarding/approvals"

import type { JsonValue } from "@nexora/shared/types/onboarding"

import { db } from "../../prisma/onboarding-db"

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

interface Review {
  reviewerUserId: string
  decision: ApprovalDecision
  comment: string | null
}

const reviewFields = ({ reviewerUserId, decision, comment }: Review) => ({
  status: decision === "APPROVE" ? ("APPROVED" as const) : ("REJECTED" as const),
  reviewedByUserId: reviewerUserId,
  reviewedAt: Temporal.Now.instant(),
  reviewComment: comment,
})

/**
 * Closes the onboarding the request came from: COMPLETED on approval,
 * REJECTED (with the reason the applicant sees) on rejection. Only while
 * it's still on the request's revision: a newer revision isn't this
 * decision's to close.
 */
const closeOnboarding = async (
  tx: Transaction,
  request: { onboardingId: string; applicationRevision: number },
  { decision, comment }: Review
) => {
  const now = Temporal.Now.instant()
  await tx.orm.public.Onboarding.where({
    id: request.onboardingId,
    revision: request.applicationRevision,
  }).update(
    decision === "APPROVE"
      ? { status: "COMPLETED", currentStep: "COMPLETED", completedAt: now }
      : { status: "REJECTED", rejectedAt: now, rejectionReason: comment }
  )
}

const queueEvent = (
  tx: Transaction,
  eventType: string,
  aggregateId: string,
  payload: AdminAccessApprovedPayload | OrganizationRequestApprovedPayload
) =>
  tx.orm.public.OutboxEvent.create({
    eventType,
    aggregateId,
    // Plain data from zod-typed payloads; the JSON column's type can't see that.
    payload: payload as unknown as JsonValue,
    status: "PENDING" as const,
    attempts: 0,
    availableAt: Temporal.Now.instant(),
  })

/**
 * Decides an admin access request that is still open. On approval,
 * onboarding.admin-access.approved goes out in the same transaction, so
 * user-service grants the permissions and auth-service makes the user an
 * ADMIN. Returns the updated request, or null when it was no longer open
 * (decided by someone else first, or withdrawn).
 */
export const decideAdminAccessRequestRepository = async (
  id: string,
  review: Review
) =>
  db.transaction(async (tx) => {
    const updated = await tx.orm.public.AdminAccessRequest.where({ id })
      .where((r) => r.status.in([...OPEN_APPROVAL_STATUSES]))
      .update(reviewFields(review))

    if (!updated) return null

    await closeOnboarding(tx, updated, review)

    if (review.decision === "APPROVE") {
      const permissions =
        await tx.orm.public.AdminAccessRequestPermission.where({
          requestId: id,
        }).all()

      const payload: AdminAccessApprovedPayload = {
        userId: updated.userId,
        requestId: id,
        approvedByUserId: review.reviewerUserId,
        permissions: permissions.map(
          ({ countryCode, moduleCode, accessLevel }) => ({
            countryCode,
            moduleCode,
            accessLevel,
          })
        ),
      }
      await queueEvent(
        tx,
        KAFKA_TOPICS.ADMIN_ACCESS_APPROVED,
        updated.userId,
        payload
      )
    }

    return updated
  })

/** The OrganizationRequest columns an approval event is built from. */
interface OrganizationRequestRow {
  id: string
  userId: string
  type: "CREATE" | "JOIN"
  organizationId: string | null
  employeeId: string | null
  jobTitle: string | null
  department: string | null
  workEmail: string | null
  reportingManager: string | null
  proposedName: string | null
  proposedSlug: string | null
  proposedDescription: string | null
  proposedCountryCode: string | null
  proposedIndustry: string | null
  proposedSize: string | null
  proposedWebsite: string | null
  proposedLogoObjectKey: string | null
  proposedTaxDetails: unknown
  proposedAddress: unknown
}

const isJsonObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

/**
 * What organization-service needs to act on an approved request, or null
 * when the request lacks something it needs (an old or broken row).
 */
const toApprovedPayload = (
  request: OrganizationRequestRow,
  permissions: OrganizationRequestApprovedPayload["permissions"],
  approvedByUserId: string
): OrganizationRequestApprovedPayload | null => {
  const base = {
    requestId: request.id,
    userId: request.userId,
    approvedByUserId,
    permissions,
  }

  if (request.type === "JOIN") {
    if (!request.organizationId) return null
    return {
      ...base,
      type: "JOIN",
      organizationId: request.organizationId,
      membership: {
        employeeId: request.employeeId,
        jobTitle: request.jobTitle,
        department: request.department,
        workEmail: request.workEmail,
        reportingManager: request.reportingManager,
      },
    }
  }

  const {
    proposedName: name,
    proposedSlug: slug,
    proposedCountryCode: countryCode,
    proposedIndustry: industry,
    proposedSize: size,
    proposedLogoObjectKey: logoObjectKey,
    proposedTaxDetails: taxDetails,
    proposedAddress: address,
  } = request

  if (
    !name ||
    !slug ||
    !countryCode ||
    !industry ||
    !size ||
    !logoObjectKey ||
    !isJsonObject(taxDetails) ||
    !isJsonObject(address)
  ) {
    return null
  }

  return {
    ...base,
    type: "CREATE",
    organization: {
      name,
      slug,
      description: request.proposedDescription,
      countryCode: countryCode.toUpperCase(),
      industry,
      size,
      website: request.proposedWebsite,
      logoObjectKey,
      taxDetails,
      address,
    },
  }
}

/** Thrown inside the transaction, so a half-decided request rolls back. */
export class IncompleteRequestError extends Error {}

/**
 * Decides a CREATE or JOIN request that is still open. On approval,
 * onboarding.organization-request.approved goes out in the same
 * transaction for organization-service to create the organization or the
 * membership. Returns the updated request, or null when it was no longer
 * open. Throws IncompleteRequestError when an approved request lacks what
 * organization-service needs.
 */
export const decideOrganizationRequestRepository = async (
  id: string,
  type: "CREATE" | "JOIN",
  review: Review
) =>
  db.transaction(async (tx) => {
    const updated = await tx.orm.public.OrganizationRequest.where({ id, type })
      .where((r) => r.status.in([...OPEN_APPROVAL_STATUSES]))
      .update(reviewFields(review))

    if (!updated) return null

    await closeOnboarding(tx, updated, review)

    if (review.decision === "APPROVE") {
      const permissions =
        await tx.orm.public.OrganizationRequestPermission.where({
          requestId: id,
        }).all()

      const payload = toApprovedPayload(
        updated,
        permissions.map(({ moduleCode, accessLevel }) => ({
          moduleCode,
          accessLevel,
        })),
        review.reviewerUserId
      )
      if (!payload) throw new IncompleteRequestError(id)

      await queueEvent(
        tx,
        KAFKA_TOPICS.ORGANIZATION_REQUEST_APPROVED,
        updated.userId,
        payload
      )
    }

    return updated
  })
