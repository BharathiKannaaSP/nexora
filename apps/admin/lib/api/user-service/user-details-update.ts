"use server"

import type { UpdateUserDetailsFormValues } from "@nexora/schemas/user-details/user-details-update"
import type { ApiSuccessResponse } from "@nexora/shared/types/api"
import type { UserDetailsResponseData } from "@nexora/shared/types/user"
import { toApiResult, type ApiResult } from "../result"
import { api } from "../server"

/** Saves the signed-in user's profile details. */
export async function updateUserDetails(
  input: UpdateUserDetailsFormValues
): Promise<ApiResult<UserDetailsResponseData>> {
  return toApiResult(
    api.put<ApiSuccessResponse<UserDetailsResponseData>>(
      "/user/user-details",
      input,
      { cache: "no-store" }
    )
  )
}
