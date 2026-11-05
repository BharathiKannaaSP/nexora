"use server"

import type { BecomeAdminFormValues } from "@nexora/schemas/onboarding/become-admin"
import type { BecomeAdminRequestResponseData } from "@nexora/shared/types/onboarding"

import { apiResult, type ApiResult } from "../result"

/**
 * Saves the signed-in user's become-admin request (step 3) and moves their
 * onboarding on to REVIEW. Sending it again from step 3 replaces the request.
 */
export async function submitBecomeAdminRequest(
  values: BecomeAdminFormValues
): Promise<ApiResult<BecomeAdminRequestResponseData>> {
  return apiResult.post<BecomeAdminRequestResponseData>(
    "/onboarding/become-admin-request",
    values
  )
}
