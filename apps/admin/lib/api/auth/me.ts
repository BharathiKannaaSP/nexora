import type { MeResponseData } from "@nexora/shared/types/auth"

import { apiResult, type ApiResult } from "../result"

/** For Server Components. */
export async function getCurrentUser(): Promise<ApiResult<MeResponseData>> {
  return apiResult.get<MeResponseData>("/auth/me")
}
