import type { ListApprovalsQuery } from "@nexora/schemas/onboarding/approvals"
import type { ListApprovalsResponseData } from "@nexora/shared/types/approvals"

import { apiResult, type ApiResult } from "../result"

export async function listApprovals(
  query: ListApprovalsQuery
): Promise<ApiResult<ListApprovalsResponseData>> {
  return apiResult.get<ListApprovalsResponseData>("/aggregate/approvals", {
    query,
  })
}
