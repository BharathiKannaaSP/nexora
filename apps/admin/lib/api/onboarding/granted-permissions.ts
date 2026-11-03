import {
  toCountryPermissions,
  type CountryPermissions,
} from "@/lib/auth/permissions"
import { getBecomeAdminFormDetails } from "./become-admin-get"

/**
 * What the signed-in user was granted: the permissions on their admin access
 * request once it's APPROVED. Anything else, including users who never took
 * the become-admin path, grants nothing.
 */
export async function getGrantedPermissions(): Promise<CountryPermissions> {
  const result = await getBecomeAdminFormDetails()
  const request = result.success ? result.data.adminAccessRequest : null

  if (request?.status !== "APPROVED") return {}
  return toCountryPermissions(request.requestedPermissions)
}
