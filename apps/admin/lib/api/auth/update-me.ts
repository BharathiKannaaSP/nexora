"use server"

import type { UpdateMeFormValues } from "@nexora/schemas/auth/update-me"
import type { MeResponseData } from "@nexora/shared/types/auth"

import { apiResult, type ApiResult } from "../result"

export async function updateMe(
  values: UpdateMeFormValues
): Promise<ApiResult<MeResponseData>> {
  return apiResult.patch<MeResponseData>("/auth/me/update", values)
}
