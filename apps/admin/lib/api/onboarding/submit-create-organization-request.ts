"use server"

import type { CreateOrganizationRequestBody } from "@nexora/schemas/onboarding/create-organization"
import type { OrganizationRequestResponseData } from "@nexora/shared/types/onboarding"

import { apiResult, type ApiResult } from "../result"

/**
 * Saves the signed-in user's create-organization request (step 3) with the
 * keys of its uploaded logo and documents, and moves their onboarding on to
 * REVIEW. Sending it again from step 3 replaces the request.
 */
export async function submitCreateOrganizationRequest(
  body: CreateOrganizationRequestBody
): Promise<ApiResult<OrganizationRequestResponseData>> {
  return apiResult.post<OrganizationRequestResponseData>(
    "/onboarding/organization-request",
    body
  )
}
