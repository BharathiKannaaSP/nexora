"use server"

import type { CreateOrganizationRequestBody } from "@nexora/schemas/onboarding/create-organization"
import type { ApiSuccessResponse } from "@nexora/shared/types/api"
import type { OrganizationRequestResponseData } from "@nexora/shared/types/onboarding"
import { toApiResult, type ApiResult } from "../result"
import { api } from "../server"

/**
 * Saves the signed-in user's create-organization request (step 3) with the
 * keys of its uploaded logo and documents, and moves their onboarding on to
 * REVIEW. Sending it again from step 3 replaces the request.
 */
export async function submitCreateOrganizationRequest(
  body: CreateOrganizationRequestBody
): Promise<ApiResult<OrganizationRequestResponseData>> {
  return toApiResult(
    api.post<ApiSuccessResponse<OrganizationRequestResponseData>>(
      "/onboarding/organization-request",
      body,
      { cache: "no-store" }
    )
  )
}
