import type {
  ApprovalDetailQuery,
  ApprovalRequestParams,
} from "@nexora/schemas/onboarding/approvals"
import type { ApprovalDetailResponseData } from "@nexora/shared/types/approvals"

import { apiResult, type ApiResult } from "../result"

/**
 * One request, for its reviewer, under the page's /[country];
 * APPROVAL_NOT_FOUND for anyone else, APPROVAL_COUNTRY_FORBIDDEN (403) for
 * its reviewer under a country it doesn't belong to.
 */
export async function getApproval(
  { type, id }: ApprovalRequestParams,
  query: ApprovalDetailQuery
): Promise<ApiResult<ApprovalDetailResponseData>> {
  return apiResult.get<ApprovalDetailResponseData>(
    `/aggregate/approvals/${type}/${encodeURIComponent(id)}`,
    { query }
  )
}
