// `data` of approvals responses, as they arrive over JSON: timestamps are
// ISO 8601 strings.
import type {
  ApprovalPriority,
  ApprovalRequestType,
  ApprovalStatus,
} from "@nexora/schemas/onboarding/approvals"

import type { AdminAccessRequest, OrganizationRequest } from "./onboarding"
import type { OrganizationDirectoryEntry } from "./organization"
import type { UserDetailsResponseData } from "./user"

/** One request in a reviewer's queue, as onboarding-service knows it. */
export interface ApprovalQueueItem {
  id: string
  type: ApprovalRequestType
  status: ApprovalStatus
  priority: ApprovalPriority
  overdue: boolean
  /** ADMIN_ACCESS: current organization. CREATE_ORG: proposed name. JOIN_ORG: null. */
  subject: string | null
  /** JOIN_ORG only: the organization being joined. */
  organizationId: string | null
  /**
   * The countries the request is for, uppercase: ADMIN_ACCESS the ones it
   * asks permissions in, CREATE_ORG the new organization's. Empty for
   * JOIN_ORG: the organization's country is in organization-service.
   */
  countryCodes: string[]
  submittedByUserId: string
  assignedToUserId: string
  submittedAt: string
}

/** GET /onboarding/approvals/queue */
export interface ApprovalQueueResponseData {
  items: ApprovalQueueItem[]
}

/** Someone shown on a row; name and email are null when the lookup failed. */
export interface ApprovalPerson {
  userId: string
  name: string | null
  email: string | null
  avatarUrl: string | null
}

export interface ApprovalListItem {
  id: string
  type: ApprovalRequestType
  status: ApprovalStatus
  priority: ApprovalPriority
  overdue: boolean
  /** What the request is about, e.g. the organization's name. */
  subject: string | null
  submittedBy: ApprovalPerson
  assignedTo: ApprovalPerson
  submittedAt: string
}

/** For the country and status asked for; ignores type, priority and search. */
export interface ApprovalSummary {
  total: number
  overdue: number
  byType: Record<ApprovalRequestType, number>
}

/** GET /aggregate/approvals/summary */
export interface ApprovalSummaryResponseData {
  summary: ApprovalSummary
}

/** GET /aggregate/approvals */
export interface ListApprovalsResponseData {
  summary: ApprovalSummary
  items: ApprovalListItem[]
  /** May be lower than asked for, when the asked page is past the end. */
  page: number
  pageSize: number
  /** Items after type, priority and search, before paging. */
  total: number
}
/** The request itself, as the applicant submitted it. */
export type ApprovalRequestRecord =
  | { type: "ADMIN_ACCESS"; adminAccessRequest: AdminAccessRequest }
  | { type: "CREATE_ORG" | "JOIN_ORG"; organizationRequest: OrganizationRequest }

/** One request as onboarding-service knows it, for its reviewer. */
export interface ApprovalRecordItem extends ApprovalQueueItem {
  /** When the current reviewer got it. */
  assignedAt: string
  reviewedByUserId: string | null
  reviewedAt: string | null
  reviewComment: string | null
}

/** GET /onboarding/approvals/:type/:id */
export interface ApprovalRecordResponseData {
  item: ApprovalRecordItem
  request: ApprovalRequestRecord
}

/** Short-lived signed URLs for one of the request's files. */
export interface ApprovalFileUrls {
  viewUrl: string
  downloadUrl: string
}

export interface ApprovalDetail extends ApprovalListItem {
  assignedAt: string
  /** Uppercase; see ApprovalQueueItem.countryCodes. */
  countryCodes: string[]
  reviewedBy: ApprovalPerson | null
  reviewedAt: string | null
  reviewComment: string | null
  /** The applicant's profile; null when it couldn't be loaded. */
  applicant: UserDetailsResponseData | null
  request: ApprovalRequestRecord
  /** JOIN_ORG: the organization being joined; null otherwise or if gone. */
  organization: OrganizationDirectoryEntry | null
  /** By object key, for the logo and documents; a key that failed is missing. */
  fileUrls: Record<string, ApprovalFileUrls>
}

/** GET /aggregate/approvals/:type/:id */
export interface ApprovalDetailResponseData {
  approval: ApprovalDetail
}

/** POST /onboarding/approvals/:type/:id/decision */
export interface ApprovalDecisionResponseData {
  id: string
  type: ApprovalRequestType
  status: ApprovalStatus
}
