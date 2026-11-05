"use server"

import type { ObjectKeyResponseData } from "@nexora/shared/types/media"

import { apiResult, type ApiResult } from "../result"

/** Deletes one of the user's own uploads from S3. */
export async function deleteUpload(
  key: string
): Promise<ApiResult<ObjectKeyResponseData>> {
  return apiResult.post<ObjectKeyResponseData>("/media/uploads/delete", {
    key,
  })
}
