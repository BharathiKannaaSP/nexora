"use server"

import type { OwnUploadUrlInput } from "@nexora/schemas/media/upload"
import type { ApiSuccessResponse } from "@nexora/shared/types/api"
import type { FileUrlResponseData } from "@nexora/shared/types/media"
import { toApiResult, type ApiResult } from "../result"
import { api } from "../server"

/**
 * A short-lived signed URL for one of the user's own uploads: inline to
 * preview or view it, or a download named `fileName`.
 */
export async function getUploadUrl({
  key,
  fileName,
}: OwnUploadUrlInput): Promise<ApiResult<FileUrlResponseData>> {
  return toApiResult(
    api.get<ApiSuccessResponse<FileUrlResponseData>>("/media/uploads/url", {
      query: { key, fileName },
      cache: "no-store",
    })
  )
}
