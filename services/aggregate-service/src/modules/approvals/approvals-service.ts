import {
  APPROVAL_REQUEST_TYPES,
  type ApprovalSummaryQuery,
  type ListApprovalsQuery,
} from "@nexora/schemas/onboarding/approvals"
import type {
  ApprovalListItem,
  ApprovalQueueItem,
  ApprovalQueueResponseData,
  ApprovalSummary,
  ListApprovalsResponseData,
} from "@nexora/shared/types/approvals"

import { fetchFromService } from "../../clients/service-client"
import { enrichApprovals, resolveRequestCountries } from "./approval-enrichment"
import {
  fetchReviewedCountries,
  isVisibleInCountry,
} from "./approval-visibility"

/**
 * The caller's queue in `status`, only the requests that belong under
 * /`country` (see isVisibleInCountry): a reviewer of India and Australia
 * sees India's requests under /in and Australia's under /au.
 */
const fetchQueue = async (
  userId: string,
  { country, status }: ApprovalSummaryQuery
) => {
  const [{ items }, reviewed] = await Promise.all([
    fetchFromService<ApprovalQueueResponseData>(
      "onboarding",
      "/api/v1/onboarding/approvals/queue",
      userId,
      { query: { status } }
    ),
    fetchReviewedCountries(userId),
  ])
  const resolved = await resolveRequestCountries(userId, items)

  return resolved.filter((item) => isVisibleInCountry(item, country, reviewed))
}

export const summarize = (items: ApprovalQueueItem[]): ApprovalSummary => ({
  total: items.length,
  overdue: items.filter(({ overdue }) => overdue).length,
  byType: Object.fromEntries(
    APPROVAL_REQUEST_TYPES.map((type) => [
      type,
      items.filter((item) => item.type === type).length,
    ])
  ) as ApprovalSummary["byType"],
})

const matchesSearch = (item: ApprovalListItem, q: string) => {
  const needle = q.toLocaleLowerCase()
  return [item.subject, item.submittedBy.name, item.submittedBy.email].some(
    (value) => value?.toLocaleLowerCase().includes(needle)
  )
}

export const getApprovalSummary = async (
  userId: string,
  query: ApprovalSummaryQuery
) => ({ summary: summarize(await fetchQueue(userId, query)) })

/**
 * The caller's queue: counts over the whole status, then type and priority
 * (cheap, before any lookup), then names and the search (which needs them),
 * then one page.
 */
export const listApprovals = async (
  userId: string,
  { country, type, status, priority, q, page, pageSize }: ListApprovalsQuery
): Promise<ListApprovalsResponseData> => {
  const queue = await fetchQueue(userId, { country, status })
  const summary = summarize(queue)

  const narrowed = queue.filter(
    (item) =>
      (!type || item.type === type) && (!priority || item.priority === priority)
  )

  // Without a search only the page needs names, so look up only that.
  if (!q) {
    const lastPage = Math.max(1, Math.ceil(narrowed.length / pageSize))
    const current = Math.min(page, lastPage)
    const slice = narrowed.slice((current - 1) * pageSize, current * pageSize)

    return {
      summary,
      items: await enrichApprovals(userId, slice),
      page: current,
      pageSize,
      total: narrowed.length,
    }
  }

  const matched = (await enrichApprovals(userId, narrowed)).filter((item) =>
    matchesSearch(item, q)
  )
  const lastPage = Math.max(1, Math.ceil(matched.length / pageSize))
  const current = Math.min(page, lastPage)

  return {
    summary,
    items: matched.slice((current - 1) * pageSize, current * pageSize),
    page: current,
    pageSize,
    total: matched.length,
  }
}
