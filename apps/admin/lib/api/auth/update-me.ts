"use server"

import type { ApiSuccessResponse } from "@nexora/shared/types/api"
import type { MeResponseData } from "@nexora/shared/types/auth"
import { toApiResult, type ApiResult } from "../result"
import { api } from "../server"
import { UpdateMeFormValues } from "@nexora/schemas/auth/update-me"

export async function updateMe(
  values: UpdateMeFormValues
): Promise<ApiResult<MeResponseData>> {
  return toApiResult(
    api.patch<ApiSuccessResponse<MeResponseData>>("/auth/me/update", values, {
      cache: "no-store",
    })
  )
}
