import z from "zod"
import { PermissionAction, PermissionModuleCode } from "./become-admin"

export const APPROVAL_REQUEST_TYPES = [
  "ADMIN_ACCESS",
  "CREATE_ORG",
  "JOIN_ORG",
] as const
export type ApprovalRequestType = (typeof APPROVAL_REQUEST_TYPES)[number]

export const APPROVAL_STATUSES = [
  "PENDING",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "WITHDRAWN",
] as const
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number]

/** The status filter: one status, or ALL of them. */
export const APPROVAL_STATUS_FILTERS = ["ALL", ...APPROVAL_STATUSES] as const
export type ApprovalStatusFilter = (typeof APPROVAL_STATUS_FILTERS)[number]

export const OPEN_APPROVAL_STATUSES = [
  "PENDING",
  "UNDER_REVIEW",
] as const satisfies ApprovalStatus[]

export const isOpenApprovalStatus = (status: ApprovalStatus) =>
  (OPEN_APPROVAL_STATUSES as readonly ApprovalStatus[]).includes(status)

export const APPROVAL_PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const
export type ApprovalPriority = (typeof APPROVAL_PRIORITIES)[number]

export const APPROVAL_PAGE_SIZES = [10, 20, 50, 100] as const
export type ApprovalPageSize = (typeof APPROVAL_PAGE_SIZES)[number]

/** An open request older than this is overdue. */
export const APPROVAL_SLA_HOURS = 72

/** Age, in hours, from which an open request has each priority. */
export const APPROVAL_PRIORITY_FROM_HOURS = {
  HIGH: 72,
  MEDIUM: 24,
} as const

/** The admin module whose holders review each kind of request. */
export const REVIEWER_MODULE = {
  ADMIN_ACCESS: "USER_MANAGEMENT",
  CREATE_ORG: "ORGANIZATION_MANAGEMENT",
  JOIN_ORG: "ORGANIZATION_MANAGEMENT",
} as const satisfies Record<ApprovalRequestType, PermissionModuleCode>

/** Approving or rejecting changes a request: VIEW isn't enough. */
export const REVIEWER_ACCESS_LEVEL = "EDIT" as const satisfies PermissionAction


// ALL by default, so a request that moved on (e.g. to UNDER_REVIEW or
// APPROVED) stays in sight instead of vanishing behind the filter.
export const APPROVAL_FILTER_DEFAULTS = {
  status: "ALL",
  page: 1,
  pageSize: 10,
} as const satisfies {
  status: ApprovalStatusFilter
  page: number
  pageSize: ApprovalPageSize
}

export const APPROVAL_SEARCH_MAX_LENGTH = 100

const pageSizeSchema = z.coerce
  .number()
  .int()
  .refine((n) => (APPROVAL_PAGE_SIZES as readonly number[]).includes(n))
  .transform((n) => n as ApprovalPageSize)

/** ISO 3166-1 alpha-2, any case in, uppercase out, e.g. "IN". */
const countryCodeSchema = z
  .string()
  .regex(/^[A-Za-z]{2}$/)
  .transform((code) => code.toUpperCase())

/**
 * GET /aggregate/approvals. Every field falls back to its default instead
 * of failing, so a hand-edited or stale URL still shows a page. `country`
 * is the app's /[country]: only requests for that country are listed.
 */
export const listApprovalsQuerySchema = z.object({
  country: countryCodeSchema,
  type: z.enum(APPROVAL_REQUEST_TYPES).optional().catch(undefined),
  status: z
    .enum(APPROVAL_STATUS_FILTERS)
    .default(APPROVAL_FILTER_DEFAULTS.status)
    .catch(APPROVAL_FILTER_DEFAULTS.status),
  priority: z.enum(APPROVAL_PRIORITIES).optional().catch(undefined),
  q: z
    .string()
    .trim()
    .max(APPROVAL_SEARCH_MAX_LENGTH)
    .optional()
    .transform((q) => q || undefined)
    .catch(undefined),
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(APPROVAL_FILTER_DEFAULTS.page)
    .catch(APPROVAL_FILTER_DEFAULTS.page),
  pageSize: pageSizeSchema
    .default(APPROVAL_FILTER_DEFAULTS.pageSize)
    .catch(APPROVAL_FILTER_DEFAULTS.pageSize),
})
export type ListApprovalsQuery = z.infer<typeof listApprovalsQuerySchema>

/** GET /aggregate/approvals/summary: counts for one country and status. */
export const approvalSummaryQuerySchema = listApprovalsQuerySchema.pick({
  country: true,
  status: true,
})
export type ApprovalSummaryQuery = z.infer<typeof approvalSummaryQuerySchema>

/**
 * GET /onboarding/approvals/queue: every country. Onboarding doesn't know a
 * JOIN request's country (the organization's, in organization-service), so
 * aggregate-service narrows the queue to one.
 */
export const approvalQueueQuerySchema = listApprovalsQuerySchema.pick({
  status: true,
})
export type ApprovalQueueQuery = z.infer<typeof approvalQueueQuerySchema>
/** The route params of one request: /approvals/:type/:id. */
export const approvalRequestParamsSchema = z.object({
  type: z.enum(APPROVAL_REQUEST_TYPES),
  id: z.string().min(1).max(64),
})
export type ApprovalRequestParams = z.infer<typeof approvalRequestParamsSchema>

/**
 * GET /aggregate/approvals/:type/:id. `country` is the page's /[country]:
 * a request opened under a country it doesn't belong to is not found, the
 * same rule the list uses.
 */
export const approvalDetailQuerySchema = z.object({
  country: countryCodeSchema,
})
export type ApprovalDetailQuery = z.infer<typeof approvalDetailQuerySchema>

export const APPROVAL_DECISIONS = ["APPROVE", "REJECT"] as const
export type ApprovalDecision = (typeof APPROVAL_DECISIONS)[number]

export const APPROVAL_COMMENT_MAX_LENGTH = 1000

/**
 * POST /onboarding/approvals/:type/:id/decision. A rejection needs a
 * reason: the applicant sees it on their review page.
 */
export const approvalDecisionInputSchema = z
  .object({
    decision: z.enum(APPROVAL_DECISIONS),
    comment: z
      .string()
      .trim()
      .max(APPROVAL_COMMENT_MAX_LENGTH)
      .optional()
      .transform((comment) => comment || undefined),
  })
  .refine(({ decision, comment }) => decision !== "REJECT" || !!comment, {
    path: ["comment"],
    message: "Give a reason for the rejection",
  })
export type ApprovalDecisionInput = z.input<typeof approvalDecisionInputSchema>
