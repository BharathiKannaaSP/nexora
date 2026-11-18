import { Temporal } from "temporal-polyfill"

import {
  REVIEWER_MODULE,
  type ApprovalDecisionInput,
  type ApprovalRequestParams,
  type ApprovalRequestType,
  type ApprovalStatus,
} from "@nexora/schemas/onboarding/approvals"
import { AppError } from "@nexora/shared/express/app-error"
import type {
  ApprovalDecisionResponseData,
  ApprovalRecordResponseData,
  ApprovalRequestRecord,
} from "@nexora/shared/types/approvals"

import { derivePriority, isOverdue } from "./approval-sla"
import {
  decideAdminAccessRequestRepository,
  decideOrganizationRequestRepository,
  IncompleteRequestError,
} from "./approval-decision-repository"
import {
  findAdminAccessRequestRepository,
  findCurrentAssignmentRepository,
  findOrganizationRequestRepository,
  holdsReviewerPermissionRepository,
} from "./approvals-repository"

const ORGANIZATION_REQUEST_TYPE = {
  CREATE_ORG: "CREATE",
  JOIN_ORG: "JOIN",
} as const satisfies Partial<Record<ApprovalRequestType, string>>

// Also for requests that exist but aren't the caller's, so ids can't be probed.
const approvalNotFound = () =>
  new AppError("Approval request not found", 404, "APPROVAL_NOT_FOUND")

/** The request with its permissions (and documents), whatever its type. */
const findRequest = async ({ type, id }: ApprovalRequestParams) => {
  if (type === "ADMIN_ACCESS") {
    const request = await findAdminAccessRequestRepository(id)
    return request && { request, countryCodes: [...new Set(
      request.requestedPermissions.map(({ countryCode }) => countryCode.toUpperCase())
    )] }
  }

  const request = await findOrganizationRequestRepository(
    id,
    ORGANIZATION_REQUEST_TYPE[type]
  )
  return request && {
    request,
    countryCodes:
      request.type === "CREATE" && request.proposedCountryCode
        ? [request.proposedCountryCode.toUpperCase()]
        : [],
  }
}

/**
 * One request, for its current reviewer or the one who decided it; anyone
 * else gets APPROVAL_NOT_FOUND.
 */
export const getApprovalRecordService = async (
  reviewerUserId: string,
  params: ApprovalRequestParams
): Promise<ApprovalRecordResponseData> => {
  const [found, assignment] = await Promise.all([
    findRequest(params),
    findCurrentAssignmentRepository(params.type, params.id),
  ])

  if (!found || !assignment) throw approvalNotFound()

  const { request, countryCodes } = found
  if (
    assignment.assignedToUserId !== reviewerUserId &&
    request.reviewedByUserId !== reviewerUserId
  ) {
    throw approvalNotFound()
  }

  const now = Temporal.Now.instant()
  const status = request.status as ApprovalStatus

  // JSON round trip: Temporal instants become ISO strings, as on the wire.
  const record = JSON.parse(JSON.stringify(request))

  return {
    item: {
      id: request.id,
      type: params.type,
      status,
      priority: derivePriority(status, request.submittedAt, now),
      overdue: isOverdue(status, request.submittedAt, now),
      subject:
        "currentOrganizationName" in request
          ? request.currentOrganizationName
          : request.type === "CREATE"
            ? request.proposedName
            : null,
      organizationId:
        "type" in request && request.type === "JOIN"
          ? request.organizationId
          : null,
      countryCodes,
      submittedByUserId: request.userId,
      assignedToUserId: assignment.assignedToUserId,
      submittedAt: request.submittedAt.toString(),
      assignedAt: assignment.assignedAt.toString(),
      reviewedByUserId: request.reviewedByUserId,
      reviewedAt: request.reviewedAt?.toString() ?? null,
      reviewComment: request.reviewComment,
    },
    request: (params.type === "ADMIN_ACCESS"
      ? { type: params.type, adminAccessRequest: record }
      : { type: params.type, organizationRequest: record }) as ApprovalRequestRecord,
  }
}

const notOpen = () =>
  new AppError(
    "This request has already been decided",
    409,
    "APPROVAL_ALREADY_DECIDED"
  )

/**
 * Approves or rejects a request. Only its current reviewer may, and only
 * while they can still review its type somewhere (permissions can be taken
 * away after assignment).
 */
export const decideApprovalService = async (
  reviewerUserId: string,
  params: ApprovalRequestParams,
  { decision, comment }: ApprovalDecisionInput
): Promise<ApprovalDecisionResponseData> => {
  const assignment = await findCurrentAssignmentRepository(
    params.type,
    params.id
  )
  if (!assignment || assignment.assignedToUserId !== reviewerUserId) {
    throw approvalNotFound()
  }

  if (
    !(await holdsReviewerPermissionRepository(
      reviewerUserId,
      REVIEWER_MODULE[params.type]
    ))
  ) {
    throw new AppError(
      "You can no longer review this request",
      403,
      "APPROVAL_FORBIDDEN"
    )
  }

  const review = { reviewerUserId, decision, comment: comment ?? null }

  let updated
  try {
    updated =
      params.type === "ADMIN_ACCESS"
        ? await decideAdminAccessRequestRepository(params.id, review)
        : await decideOrganizationRequestRepository(
            params.id,
            ORGANIZATION_REQUEST_TYPE[params.type],
            review
          )
  } catch (error) {
    if (error instanceof IncompleteRequestError) {
      throw new AppError(
        "The request is missing details needed to approve it",
        409,
        "APPROVAL_REQUEST_INCOMPLETE"
      )
    }
    throw error
  }

  if (!updated) {
    // Gone, or decided first by someone else.
    if (!(await findRequest(params))) throw approvalNotFound()
    throw notOpen()
  }

  return { id: updated.id, type: params.type, status: updated.status }
}
