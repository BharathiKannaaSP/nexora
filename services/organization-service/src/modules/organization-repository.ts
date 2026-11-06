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

// What a directory entry reads from an organization; nothing private.
const DIRECTORY_FIELDS = [
  "id",
  "name",
  "slug",
  "countryCode",
  "industry",
] as const

/** `%`, `_` and `\` match literally in an ILIKE pattern. */
const escapeLikePattern = (value: string) => value.replace(/[\\%_]/g, "\\$&")

/**
 * ACTIVE organizations whose name contains `search` (any case), optionally
 * in one country, sorted by name, each with its number of ACTIVE members.
 */
export const getOrganizationDirectoryRepository = async ({
  search,
  countryCode,
  limit,
}: {
  search?: string
  countryCode?: string
  limit: number
}) => {
  let organizations = db.orm.public.Organization.select(
    ...DIRECTORY_FIELDS
  ).where({ status: "ACTIVE" })

  if (search) {
    const pattern = `%${escapeLikePattern(search)}%`
    organizations = organizations.where((o) => o.name.ilike(pattern))
  }

  if (countryCode) {
    organizations = organizations.where({ countryCode })
  }

  return organizations
    .include("memberships", (memberships) =>
      memberships.where({ status: "ACTIVE" }).count()
    )
    .orderBy([(o) => o.name.asc(), (o) => o.id.asc()])
    .limit(limit)
    .all()
}

/** One ACTIVE organization as a directory entry, or null. */
export const getOrganizationDirectoryEntryRepository = async (
  organizationId: string
) => {
  return db.orm.public.Organization.select(...DIRECTORY_FIELDS)
    .where({ id: organizationId, status: "ACTIVE" })
    .include("memberships", (memberships) =>
      memberships.where({ status: "ACTIVE" }).count()
    )
    .first()
}
