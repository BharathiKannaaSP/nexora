import { Temporal } from "temporal-polyfill"
import { db } from "../prisma/user-db"
import type { UpdateUserDetailsInput } from "@nexora/schemas/user-details/user-details-update"

/** Creates an empty profile unless one exists; returns whether it did. */
export const createUserProfileRepository = async (
  userId: string,
  languageCode: string
): Promise<boolean> => {
  return db.transaction(async (tx) => {
    const existing = await tx.orm.public.UserProfile.where({ userId }).first()

    if (existing) {
      return false
    }

    await tx.orm.public.UserProfile.create({
      userId,
      languageCode,
      profileStatus: "INCOMPLETE",
    })

    return true
  })
}

export const getUserDetailsRepository = async (userId: string) => {
  return db.orm.public.UserProfile.where({ userId }).first()
}

/** Saving every required field completes the profile. */
export const updateUserDetailsRepository = async (
  userId: string,
  { timeZone, ...input }: UpdateUserDetailsInput
) => {
  return db.orm.public.UserProfile.where({ userId }).update({
    ...input,
    timezone: timeZone,
    addressLine2: input.addressLine2 || null,
    // Blank for countries without postal codes.
    postalCode: input.postalCode || null,
    // Stored as midnight UTC of the given date.
    dob: Temporal.PlainDate.from(input.dob).toZonedDateTime("UTC").toInstant(),
    profileStatus: "COMPLETE",
  })
}
