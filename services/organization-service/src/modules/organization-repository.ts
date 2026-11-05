import { db } from "../prisma/organization-db"

/** The user's active memberships, each with its organization. */
export const getMyOrganizationsRepository = async (userId: string) => {
  return db.transaction(async (tx) => {
    const memberships = await tx.orm.public.OrganizationMembership.where({
      userId,
      status: "ACTIVE",
    }).all()

    if (memberships.length === 0) return []

    const organizations = await tx.orm.public.Organization.where((o) =>
      o.id.in(memberships.map(({ organizationId }) => organizationId))
    ).all()

    const byId = new Map(organizations.map((org) => [org.id, org]))

    return memberships.flatMap((membership) => {
      const organization = byId.get(membership.organizationId)
      return organization ? [{ ...membership, organization }] : []
    })
  })
}

export const getActiveMembershipRepository = async (
  organizationId: string,
  userId: string
) => {
  return db.orm.public.OrganizationMembership.where({
    organizationId,
    userId,
    status: "ACTIVE",
  }).first()
}

export const getOrganizationRepository = async (organizationId: string) => {
  return db.orm.public.Organization.where({ id: organizationId }).first()
}
