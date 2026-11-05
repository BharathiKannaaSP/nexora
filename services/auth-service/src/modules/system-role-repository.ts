import { db } from "../prisma/auth-db"

/**
 * Roles an approved admin access request may replace. ADMIN is already
 * there; ORG_ADMIN / ORG_MEMBER came from another onboarding path and
 * aren't overwritten silently.
 */
const PROMOTABLE_ROLES = ["USER", "GUEST"] as const

/**
 * Makes the user an ADMIN after their admin access request was approved.
 * Idempotent, since Kafka can deliver an event twice. Returns what happened.
 */
export const promoteToAdminRepository = async (
  userId: string
): Promise<"promoted" | "already-admin" | "not-promotable" | "not-found"> => {
  return db.transaction(async (tx) => {
    const promoted = await tx.orm.public.User.where({ id: userId })
      .where((u) => u.systemRole.in([...PROMOTABLE_ROLES]))
      .update({ systemRole: "ADMIN" })

    if (promoted) return "promoted"

    const user = await tx.orm.public.User.where({ id: userId }).first()
    if (!user) return "not-found"
    return user.systemRole === "ADMIN" ? "already-admin" : "not-promotable"
  })
}
