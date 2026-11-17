import {
  APPROVAL_FILTER_DEFAULTS,
  listApprovalsQuerySchema,
  type ApprovalRequestType,
  type ListApprovalsQuery,
} from "@nexora/schemas/onboarding/approvals"

import {
  firstParam,
  withSearchParams,
  type SearchParamsRecord,
} from "@/lib/url/search-params"

import { APPROVAL_TYPES, approvalTypeFromSlug } from "./approval-types"

export type ApprovalFilters = ListApprovalsQuery

/** URL param names, shared with the client filter controls. */
export const APPROVAL_PARAMS = {
  type: "type",
  status: "status",
  priority: "priority",
  q: "q",
  page: "page",
  pageSize: "pageSize",
} as const

/**
 * Filters from the URL. Unknown values fall back to defaults, and a type the
 * user can't review is dropped (the "All" tab shows instead). `country` is
 * the page's /[country], so only that country's requests are listed.
 */
export const parseApprovalSearchParams = (
  params: SearchParamsRecord,
  visibleTypes: readonly ApprovalRequestType[],
  country: string
): ApprovalFilters => {
  const type = approvalTypeFromSlug(firstParam(params, APPROVAL_PARAMS.type))

  const parsed = listApprovalsQuerySchema.parse({
    country,
    status: firstParam(params, APPROVAL_PARAMS.status),
    priority: firstParam(params, APPROVAL_PARAMS.priority),
    q: firstParam(params, APPROVAL_PARAMS.q),
    page: firstParam(params, APPROVAL_PARAMS.page),
    pageSize: firstParam(params, APPROVAL_PARAMS.pageSize),
  })

  return {
    ...parsed,
    type: type && visibleTypes.includes(type) ? type : undefined,
  }
}

/** `basePath` with `filters` plus `patch` in the query, defaults left out. */
export const approvalsHref = (
  basePath: string,
  filters: ApprovalFilters,
  patch: Partial<ApprovalFilters> = {}
) => {
  const next = { ...filters, ...patch }
  return withSearchParams(
    basePath,
    {
      [APPROVAL_PARAMS.type]: next.type ? APPROVAL_TYPES[next.type].slug : null,
      [APPROVAL_PARAMS.status]: next.status,
      [APPROVAL_PARAMS.priority]: next.priority,
      [APPROVAL_PARAMS.q]: next.q,
      [APPROVAL_PARAMS.page]: next.page,
      [APPROVAL_PARAMS.pageSize]: next.pageSize,
    },
    APPROVAL_FILTER_DEFAULTS
  )
}

/** Any filter besides the tab and paging differs from its default. */
export const hasActiveApprovalFilters = (filters: ApprovalFilters) =>
  filters.status !== APPROVAL_FILTER_DEFAULTS.status ||
  filters.priority !== undefined ||
  filters.q !== undefined
