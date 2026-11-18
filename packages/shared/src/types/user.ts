// `data` of user-service responses, as they arrive over JSON: timestamps are
// ISO 8601 strings.

import type { PlatformPermission } from "@nexora/schemas/events/permissions"

export type Gender = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY"

export type ProfileStatus = "INCOMPLETE" | "COMPLETE"

/** One permission inside an organization; countryCode is the organization's. */
export interface OrganizationPermissionGrant extends PlatformPermission {
  organizationId: string
}

/** GET /user/permissions */
export interface UserPermissionsResponseData {
  /**
   * The user's platform permissions (no organization), the source of truth
   * for what they may do. countryCode is uppercase, e.g. "IN".
   */
  permissions: PlatformPermission[]
  /** What they may do in their organizations (ORG_ADMIN, ORG_MEMBER). */
  organizationPermissions: OrganizationPermissionGrant[]
}

/** GET /user/user-details, PUT /user/user-details */
export interface UserDetailsResponseData {
  id: string
  userId: string
  phoneNumber: string | null
  bioCountry: string | null
  bio: string | null
  gender: Gender | null
  dob: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  languageCode: string
  timezone: string | null
  profileStatus: ProfileStatus
  createdAt: string
  updatedAt: string
}
