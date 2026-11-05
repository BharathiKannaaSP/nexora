"use server"

import type { CreateUploadInput } from "@nexora/schemas/media/upload"
import type { CreateUploadResponseData } from "@nexora/shared/types/media"

import { apiResult, type ApiResult } from "../result"

/** A presigned S3 URL for one file, valid for a few minutes. */
export async function createUpload(
  input: CreateUploadInput
): Promise<ApiResult<CreateUploadResponseData>> {
  return apiResult.post<CreateUploadResponseData>("/media/uploads", input)
}
