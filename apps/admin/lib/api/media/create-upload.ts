"use server"

import type { CreateUploadInput } from "@nexora/schemas/media/upload"
import type { ApiSuccessResponse } from "@nexora/shared/types/api"
import type { CreateUploadResponseData } from "@nexora/shared/types/media"
import { toApiResult, type ApiResult } from "../result"
import { api } from "../server"

/** A presigned S3 URL for one file, valid for a few minutes. */
export async function createUpload(
  input: CreateUploadInput
): Promise<ApiResult<CreateUploadResponseData>> {
  return toApiResult(
    api.post<ApiSuccessResponse<CreateUploadResponseData>>(
      "/media/uploads",
      input,
      { cache: "no-store" }
    )
  )
}
