import { Temporal } from "temporal-polyfill"

import type {
  ApprovalQueueQuery,
  ApprovalStatus,
} from "@nexora/schemas/onboarding/approvals"
import type {
  ApprovalQueueItem,
  ApprovalQueueResponseData,
} from "@nexora/shared/types/approvals"

import { derivePriority, isOverdue } from "./approval-sla"
import {
  findAdminAccessRequestCountriesRepository,
  findAdminAccessRequestsRepository,
  findCurrentAssignmentsRepository,
  findOrganizationRequestsRepository,
  idsOfType,
} from "./approvals-repository"

/** A queue longer than this is cut, newest first, and logged. */
const MAX_QUEUE_ITEMS = 1000

/**
 * Every request in `status` (any for ALL) currently assigned to
 * `reviewerUserId`, in every country, newest first.
 */
export const getApprovalQueueService = async (
  reviewerUserId: string,
  { status }: ApprovalQueueQuery
): Promise<ApprovalQueueResponseData> => {
  const assignments = await findCurrentAssignmentsRepository(reviewerUserId)

  const [adminRequests, organizationRequests] = await Promise.all([
    findAdminAccessRequestsRepository(
      idsOfType(assignments, "ADMIN_ACCESS"),
      status
    ),
    findOrganizationRequestsRepository(
      idsOfType(assignments, "CREATE_ORG", "JOIN_ORG"),
      status
    ),
  ])

  const adminCountries = await findAdminAccessRequestCountriesRepository(
    adminRequests.map(({ id }) => id)
  )

  const now = Temporal.Now.instant()
  // From each request's own status: with ALL, the queue mixes statuses.
  const timing = (r: { status: ApprovalStatus; submittedAt: Temporal.Instant }) => ({
    priority: derivePriority(r.status, r.submittedAt, now),
    overdue: isOverdue(r.status, r.submittedAt, now),
    submittedAt: r.submittedAt.toString(),
  })

  const items: ApprovalQueueItem[] = [
    ...adminRequests.map((r) => ({
      id: r.id,
      type: "ADMIN_ACCESS" as const,
      status: r.status,
      subject: r.currentOrganizationName,
      organizationId: null,
      countryCodes: [...(adminCountries.get(r.id) ?? [])],
      submittedByUserId: r.userId,
      assignedToUserId: reviewerUserId,
      ...timing(r),
    })),
    ...organizationRequests.map((r) => ({
      id: r.id,
      type: r.type === "CREATE" ? ("CREATE_ORG" as const) : ("JOIN_ORG" as const),
      status: r.status,
      subject: r.type === "CREATE" ? r.proposedName : null,
      organizationId: r.type === "JOIN" ? r.organizationId : null,
      countryCodes:
        r.type === "CREATE" && r.proposedCountryCode
          ? [r.proposedCountryCode.toUpperCase()]
          : [],
      submittedByUserId: r.userId,
      assignedToUserId: reviewerUserId,
      ...timing(r),
    })),
  ].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))

  if (items.length > MAX_QUEUE_ITEMS) {
    console.warn(
      `Approval queue of ${reviewerUserId} has ${items.length} items; returning the newest ${MAX_QUEUE_ITEMS}`
    )
  }

  return { items: items.slice(0, MAX_QUEUE_ITEMS) }
}
