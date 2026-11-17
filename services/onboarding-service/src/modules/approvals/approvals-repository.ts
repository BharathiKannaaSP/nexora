import { Temporal } from "temporal-polyfill"

import {
  ApprovalRequestType,
  ApprovalStatusFilter,
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
