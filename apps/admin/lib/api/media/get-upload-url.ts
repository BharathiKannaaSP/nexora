"use server"

import type { OwnUploadUrlInput } from "@nexora/schemas/media/upload"
import type { FileUrlResponseData } from "@nexora/shared/types/media"

import { apiResult, type ApiResult } from "../result"

/**
 * A short-lived signed URL for one of the user's own uploads: inline to
 * preview or view it, or a download named `fileName`.
 */
export async function getUploadUrl({
  key,
  fileName,
}: OwnUploadUrlInput): Promise<ApiResult<FileUrlResponseData>> {
  return apiResult.get<FileUrlResponseData>("/media/uploads/url", {
    query: { key, fileName },
  })
}
