import { createUser, findUserByClerkId } from "../repositories/user.repository"
import { CreateUserInput } from "../types/user.types"

export const createUserIfNotExists = async (input: CreateUserInput) => {
  const existingUser = await findUserByClerkId(input.clerkUserId)

  if (existingUser) {
    return existingUser
  }

  return createUser(input)
}
