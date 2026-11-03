import { AppError } from "@nexora/shared/express/app-error"
import type { UpdateUserDetailsInput } from "@nexora/schemas/user-details/user-details-update"
import {
  createUserProfileRepository,
  getUserDetailsRepository,
  updateUserDetailsRepository,
} from "./user-repository"

const profileNotFound = () =>
  new AppError("User profile not found", 404, "USER_PROFILE_NOT_FOUND")

export const createUserProfileService = async (
  userId: string,
  languageCode: string
) => {
  const created = await createUserProfileRepository(userId, languageCode)
  return { userId, created }
}

export const getUserDetailsService = async (userId: string) => {
  const userDetails = await getUserDetailsRepository(userId)

  if (!userDetails) {
    throw profileNotFound()
  }

  return userDetails
}

export const updateUserDetailsService = async (
  userId: string,
  input: UpdateUserDetailsInput
) => {
  const updatedUserDetails = await updateUserDetailsRepository(userId, input)

  if (!updatedUserDetails) {
    throw profileNotFound()
  }

  return updatedUserDetails
}
