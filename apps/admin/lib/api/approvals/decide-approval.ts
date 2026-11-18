"use server"

import type {
  ApprovalDecisionInput,
  ApprovalRequestParams,
} from "@nexora/schemas/onboarding/approvals"
import type { ApprovalDecisionResponseData } from "@nexora/shared/types/approvals"

import { apiResult, type ApiResult } from "../result"

/** Approves or rejects a request assigned to the signed-in reviewer. */
export async function decideApproval(
  { type, id }: ApprovalRequestParams,
  input: ApprovalDecisionInput
): Promise<ApiResult<ApprovalDecisionResponseData>> {
  return apiResult.post<ApprovalDecisionResponseData>(
    `/onboarding/approvals/${type}/${encodeURIComponent(id)}/decision`,
    input
  )
}
