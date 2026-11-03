import type { ApiSuccessResponse } from "@nexora/shared/types/api"
import { toApiResult, type ApiResult } from "../result"
import { api } from "../server"
import { BecomeAdminFormDetailsResponseData } from "@nexora/shared/types/onboarding"

export async function getBecomeAdminFormDetails(): Promise<
  ApiResult<BecomeAdminFormDetailsResponseData>
> {
  return toApiResult(
    api.get<ApiSuccessResponse<BecomeAdminFormDetailsResponseData>>(
      "/onboarding/become-admin-request-details",
      {
        cache: "no-store",
      }
    )
  )
}
