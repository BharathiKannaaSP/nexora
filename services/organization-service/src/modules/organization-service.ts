import { AppError } from "@nexora/shared/express/app-error"
import {
  getActiveMembershipRepository,
  getMyOrganizationsRepository,
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
