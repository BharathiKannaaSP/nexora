"use server"

import type { ApiSuccessResponse } from "@nexora/shared/types/api"
import type { ObjectKeyResponseData } from "@nexora/shared/types/media"
import { toApiResult, type ApiResult } from "../result"
import { api } from "../server"

/** Deletes one of the user's own uploads from S3. */
export async function deleteUpload(
  key: string
): Promise<ApiResult<ObjectKeyResponseData>> {
  return toApiResult(
    api.post<ApiSuccessResponse<ObjectKeyResponseData>>(
      "/media/uploads/delete",
      { key },
      { cache: "no-store" }
    )
  )
}
