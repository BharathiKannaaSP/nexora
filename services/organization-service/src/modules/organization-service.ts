import type { OrganizationDirectoryQuery } from "@nexora/schemas/organization/directory"
import { AppError } from "@nexora/shared/express/app-error"
import type {
  OrganizationDirectoryEntry,
  OrganizationDirectoryEntryResponseData,
  OrganizationDirectoryResponseData,
} from "@nexora/shared/types/organization"

import {
  getActiveMembershipRepository,
  getMyOrganizationsRepository,
  getOrganizationDirectoryEntryRepository,
  getOrganizationDirectoryRepository,
  getOrganizationRepository,
} from "./organization-repository"

// Also for organizations the user isn't an active member of, so their ids
// can't be probed.
const organizationNotFound = () =>
  new AppError("Organization not found", 404, "ORGANIZATION_NOT_FOUND")

export const getMyOrganizationsService = async (userId: string) => {
  return getMyOrganizationsRepository(userId)
}

export const getOrganizationService = async (
  organizationId: string,
  userId: string
) => {
  const membership = await getActiveMembershipRepository(organizationId, userId)

  if (!membership) {
    throw organizationNotFound()
  }

  const organization = await getOrganizationRepository(organizationId)

  if (!organization) {
    throw organizationNotFound()
  }

  return { ...organization, membership }
}

/** Only the OrganizationDirectoryEntry fields, whatever the query returned. */
const toDirectoryEntry = ({
  id,
  name,
  slug,
  countryCode,
  industry,
  memberships,
}: Omit<OrganizationDirectoryEntry, "memberCount"> & {
  memberships: number
}): OrganizationDirectoryEntry => ({
  id,
  name,
  slug,
  countryCode,
  industry,
  memberCount: memberships,
})

/**
 * The organizations a signed-in user can ask to join. Any user may list
 * them, so an entry holds only what a non-member may see.
 */
export const getOrganizationDirectoryService = async ({
  search,
  country,
  limit,
}: OrganizationDirectoryQuery): Promise<OrganizationDirectoryResponseData> => {
  const organizations = await getOrganizationDirectoryRepository({
    search,
    countryCode: country,
    limit,
  })

  return { organizations: organizations.map(toDirectoryEntry) }
}

/** One directory entry; not ACTIVE counts as not found. */
export const getOrganizationDirectoryEntryService = async (
  organizationId: string
): Promise<OrganizationDirectoryEntryResponseData> => {
  const organization =
    await getOrganizationDirectoryEntryRepository(organizationId)

  if (!organization) {
    throw organizationNotFound()
  }

  return { organization: toDirectoryEntry(organization) }
}
