import type { ApiSuccessResponse } from "@nexora/shared/types/api"
import type { MeResponseData } from "@nexora/shared/types/auth"
import { toApiResult, type ApiResult } from "../result"
import { api } from "../server"
import { UserDetailsResponseData } from "@nexora/shared/types/user"

export async function getUserDetails(): Promise<
  ApiResult<UserDetailsResponseData>
> {
  return toApiResult(
    api.get<ApiSuccessResponse<UserDetailsResponseData>>("/user/user-details", {
      cache: "no-store",
    })
  )
}
