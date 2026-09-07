import { db } from "../prisma/db"
import { CreateUserInput } from "../types/auth.types"

export async function findUserByClerkId(clerkUserId: string) {
  return db.orm.public.User.where({
    clerkUserId,
  }).first()
}

export async function createUser(input: CreateUserInput) {
  return db.orm.public.User.create({
    clerkUserId: input.clerkUserId,
    email: input.email,
    firstName: input.firstName ?? null,
    lastName: input.lastName ?? null,
    imageUrl: input.imageUrl ?? null,
    systemRole: "USER",
    status: "ACTIVE",
  })
}
