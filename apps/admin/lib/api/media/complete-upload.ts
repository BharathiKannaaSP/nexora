"use server"

import type { ApiSuccessResponse } from "@nexora/shared/types/api"
import type { CompleteUploadResponseData } from "@nexora/shared/types/media"
import { toApiResult, type ApiResult } from "../result"
import { api } from "../server"

/**
 * After the browser's PUT: media-service checks the file's real size and type
 * and returns the key to submit with the form.
 */
export async function completeUpload(
  key: string
): Promise<ApiResult<CompleteUploadResponseData>> {
  return toApiResult(
    api.post<ApiSuccessResponse<CompleteUploadResponseData>>(
      "/media/uploads/complete",
      { key },
      { cache: "no-store" }
    )
  )
}
