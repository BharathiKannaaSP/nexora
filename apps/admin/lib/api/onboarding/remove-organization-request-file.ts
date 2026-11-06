"use server"

import type { ObjectKeyResponseData } from "@nexora/shared/types/media"

import { apiResult, type ApiResult } from "../result"

/**
 * Takes a saved logo or document off the user's create- or join-organization
 * request. Call it before deleting the file from S3, so the request never
 * points at a missing file.
 */
export async function removeOrganizationRequestFile(
  key: string
): Promise<ApiResult<ObjectKeyResponseData>> {
  return apiResult.post<ObjectKeyResponseData>(
    "/onboarding/organization-request/remove-file",
    { key }
  )
}
