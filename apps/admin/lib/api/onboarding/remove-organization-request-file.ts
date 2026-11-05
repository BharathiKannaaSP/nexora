"use server"

import type { ApiSuccessResponse } from "@nexora/shared/types/api"
import type { ObjectKeyResponseData } from "@nexora/shared/types/media"
import { toApiResult, type ApiResult } from "../result"
import { api } from "../server"

/**
 * Takes a saved logo or document off the user's create-organization request.
 * Call it before deleting the file from S3, so the request never points at a
 * missing file.
 */
export async function removeOrganizationRequestFile(
  key: string
): Promise<ApiResult<ObjectKeyResponseData>> {
  return toApiResult(
    api.post<ApiSuccessResponse<ObjectKeyResponseData>>(
      "/onboarding/organization-request/remove-file",
      { key },
      { cache: "no-store" }
    )
  )
}
