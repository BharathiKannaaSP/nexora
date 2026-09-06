import { createUser, findUserByClerkId } from "../repositories/auth.repository"
import { CreateUserInput } from "../types/auth.types"

export const createUserIfNotExists = async (input: CreateUserInput) => {
  const existingUser = await findUserByClerkId(input.clerkUserId)

  if (existingUser) {
    return existingUser
  }

  return createUser(input)
}

export const getCurrentUser = async (clerkUserId: string) => {
  const user = await findUserByClerkId(clerkUserId)

  if (!user) {
    const error = new Error("User not found")
    error.name = "USER_NOT_FOUND"

    throw error
  }

  return user
}
