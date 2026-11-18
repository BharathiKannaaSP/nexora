import { cache } from "react"

import type { ApprovalSummaryResponseData } from "@nexora/shared/types/approvals"

import { apiResult } from "../result"

/** Pending counts in this country, for the sidebar. Once per request. */
export const getPendingApprovalSummary = cache(async (country: string) =>
  apiResult.get<ApprovalSummaryResponseData>("/aggregate/approvals/summary", {
    query: { country, status: "PENDING" },
  })
)
