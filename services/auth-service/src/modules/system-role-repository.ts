import type { OrganizationMemberRole } from "@nexora/schemas/events/organization"

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

/** The roles each organization role may replace. */
const ORGANIZATION_ROLE_REPLACES = {
  // A member who creates their own organization moves up.
  ORG_ADMIN: ["USER", "GUEST", "ORG_MEMBER"],
  ORG_MEMBER: ["USER", "GUEST"],
} as const satisfies Record<OrganizationMemberRole, readonly string[]>

/**
 * Gives a new organization member their role. Never lowers one: an ADMIN,
 * or an ORG_ADMIN joining another organization, keeps theirs. Idempotent.
 */
export const assignOrganizationRoleRepository = async (
  userId: string,
  role: OrganizationMemberRole
): Promise<"assigned" | "unchanged" | "not-replaceable" | "not-found"> => {
  return db.transaction(async (tx) => {
    const assigned = await tx.orm.public.User.where({ id: userId })
      .where((u) => u.systemRole.in([...ORGANIZATION_ROLE_REPLACES[role]]))
      .update({ systemRole: role })

    if (assigned) return "assigned"

    const user = await tx.orm.public.User.where({ id: userId }).first()
    if (!user) return "not-found"
    return user.systemRole === role ? "unchanged" : "not-replaceable"
  })
}
