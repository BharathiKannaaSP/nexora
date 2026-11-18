import { Temporal } from "temporal-polyfill"

import {
  ApprovalRequestType,
  ApprovalStatusFilter,
  REVIEWER_ACCESS_LEVEL,
  REVIEWER_MODULE,
} from "@nexora/schemas/onboarding/approvals"

import { db } from "../../prisma/onboarding-db"

const assignmentKey = (requestType: string, requestId: string) =>
  `${requestType}:${requestId}`

/**
 * The requests whose CURRENT assignment is `reviewerUserId`. A request
 * reassigned to someone else since is left out, though the old assignment
 * row is still theirs.
 */
export const findCurrentAssignmentsRepository = async (
  reviewerUserId: string
) => {
  const mine = await db.orm.public.RequestAssignment.where({
    assignedToUserId: reviewerUserId,
  }).all()

  if (mine.length === 0) return []

  const requestIds = [...new Set(mine.map(({ requestId }) => requestId))]

  const all = await db.orm.public.RequestAssignment.where((a) =>
    a.requestId.in(requestIds)
  ).all()

  const latest = new Map<string, (typeof all)[number]>()

  for (const assignment of all) {
    const key = assignmentKey(assignment.requestType, assignment.requestId)

    const current = latest.get(key)
    if (
      !current ||
      Temporal.Instant.compare(assignment.assignedAt, current.assignedAt) > 0
    ) {
      latest.set(key, assignment)
    }
  }

  return [...latest.values()].filter(
    ({ assignedToUserId }) => assignedToUserId === reviewerUserId
  )
}

/** Admin access requests with these ids, in `status` (any for ALL). */
export const findAdminAccessRequestsRepository = async (
  ids: string[],
  status: ApprovalStatusFilter
) => {
  if (ids.length === 0) return []
  const query = db.orm.public.AdminAccessRequest.where((r) => r.id.in(ids))
  return (status === "ALL" ? query : query.where({ status })).all()
}

/**
 * The countries each admin access request asks permissions in, uppercase,
 * by request id.
 */
export const findAdminAccessRequestCountriesRepository = async (
  requestIds: string[]
) => {
  const countries = new Map<string, Set<string>>()
  if (requestIds.length === 0) return countries

  const rows = await db.orm.public.AdminAccessRequestPermission.where((p) =>
    p.requestId.in(requestIds)
  ).all()

  for (const { requestId, countryCode } of rows) {
    const held = countries.get(requestId) ?? new Set<string>()
    held.add(countryCode.toUpperCase())
    countries.set(requestId, held)
  }
  return countries
}

/** Organization requests (CREATE and JOIN) with these ids, in `status` (any for ALL). */
export const findOrganizationRequestsRepository = async (
  ids: string[],
  status: ApprovalStatusFilter
) => {
  if (ids.length === 0) return []
  const query = db.orm.public.OrganizationRequest.where((r) => r.id.in(ids))
  return (status === "ALL" ? query : query.where({ status })).all()
}

export const idsOfType = (
  assignments: { requestType: string; requestId: string }[],
  ...types: ApprovalRequestType[]
) =>
  assignments
    .filter(({ requestType }) => (types as string[]).includes(requestType))
    .map(({ requestId }) => requestId)

/** The request's current assignment (its latest), or null. */
export const findCurrentAssignmentRepository = async (
  requestType: ApprovalRequestType,
  requestId: string
) =>
  db.orm.public.RequestAssignment.where({ requestType, requestId })
    .orderBy([(a) => a.assignedAt.desc(), (a) => a.id.desc()])
    .first()

/** One admin access request with its permissions, or null. */
export const findAdminAccessRequestRepository = async (id: string) => {
  const request = await db.orm.public.AdminAccessRequest.where({ id }).first()
  if (!request) return null

  const requestedPermissions =
    await db.orm.public.AdminAccessRequestPermission.where({
      requestId: id,
    }).all()

  return { ...request, requestedPermissions }
}

/** One CREATE or JOIN request with its documents and permissions, or null. */
export const findOrganizationRequestRepository = async (
  id: string,
  type: "CREATE" | "JOIN"
) => {
  const request = await db.orm.public.OrganizationRequest.where({
    id,
    type,
  }).first()
  if (!request) return null

  const [proposedDocuments, requestedPermissions] = await Promise.all([
    db.orm.public.OrganizationRequestDocument.where({ requestId: id }).all(),
    db.orm.public.OrganizationRequestPermission.where({ requestId: id }).all(),
  ])

  return { ...request, proposedDocuments, requestedPermissions }
}

/** Whether the user may still review `moduleCode` requests in any country. */
export const holdsReviewerPermissionRepository = async (
  userId: string,
  moduleCode: (typeof REVIEWER_MODULE)[ApprovalRequestType]
) =>
  !!(await db.orm.public.ReviewerPermission.where({
    userId,
    moduleCode,
    accessLevel: REVIEWER_ACCESS_LEVEL,
  }).first())
