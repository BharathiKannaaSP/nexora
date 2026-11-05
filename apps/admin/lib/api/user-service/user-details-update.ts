"use server"

import type { UpdateUserDetailsFormValues } from "@nexora/schemas/user-details/user-details-update"
import type { UserDetailsResponseData } from "@nexora/shared/types/user"

import { apiResult, type ApiResult } from "../result"

/** Saves the signed-in user's profile details. */
export async function updateUserDetails(
  input: UpdateUserDetailsFormValues
): Promise<ApiResult<UserDetailsResponseData>> {
  return apiResult.put<UserDetailsResponseData>("/user/user-details", input)
}
