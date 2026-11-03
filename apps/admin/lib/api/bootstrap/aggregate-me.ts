import { CurrentUserOverviewResponseData } from "@nexora/shared/types/aggregate"
import { ApiResult, toApiResult } from "../result"
import { api } from "../server"
import { ApiSuccessResponse } from "@nexora/shared/types/api"

export const aggregateMe = async (): Promise<
  ApiResult<CurrentUserOverviewResponseData>
> => {
  return toApiResult(
    api.get<ApiSuccessResponse<CurrentUserOverviewResponseData>>(
      "/aggregate/me",
      {
        cache: "no-store",
      }
    )
  )
}
