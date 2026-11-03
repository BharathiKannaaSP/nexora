import type { ApiSuccessResponse } from "@nexora/shared/types/api"
import type { MeResponseData } from "@nexora/shared/types/auth"
import { toApiResult, type ApiResult } from "../result"
import { api } from "../server"

/** For Server Components. */
export async function getCurrentUser(): Promise<ApiResult<MeResponseData>> {
  return toApiResult(
    api.get<ApiSuccessResponse<MeResponseData>>("/auth/me", {
      cache: "no-store",
    })
  )
}
