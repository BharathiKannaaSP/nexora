"use server"

import type { CompleteUploadResponseData } from "@nexora/shared/types/media"

import { apiResult, type ApiResult } from "../result"

/**
 * After the browser's PUT: media-service checks the file's real size and type
 * and returns the key to submit with the form.
 */
export async function completeUpload(
  key: string
): Promise<ApiResult<CompleteUploadResponseData>> {
  return apiResult.post<CompleteUploadResponseData>("/media/uploads/complete", {
    key,
  })
}
