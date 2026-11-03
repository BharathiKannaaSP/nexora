"use server"

import type { BecomeAdminFormValues } from "@nexora/schemas/onboarding/become-admin"
import type { ApiSuccessResponse } from "@nexora/shared/types/api"
import type { BecomeAdminRequestResponseData } from "@nexora/shared/types/onboarding"
import { toApiResult, type ApiResult } from "../result"
import { api } from "../server"

/**
 * Saves the signed-in user's become-admin request (step 3) and moves their
 * onboarding on to REVIEW. Sending it again from step 3 replaces the request.
 */
export async function submitBecomeAdminRequest(
  values: BecomeAdminFormValues
): Promise<ApiResult<BecomeAdminRequestResponseData>> {
  return toApiResult(
    api.post<ApiSuccessResponse<BecomeAdminRequestResponseData>>(
      "/onboarding/become-admin-request",
      values,
      { cache: "no-store" }
    )
  )
}
