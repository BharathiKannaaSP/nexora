import type { OrganizationDirectoryEntryResponseData } from "@nexora/shared/types/organization"

import { apiResult, type ApiResult } from "../result"

/**
 * One ACTIVE organization from the directory, e.g. the one a saved join
 * request points at. Fails with ORGANIZATION_NOT_FOUND (404) otherwise.
 */
export async function getDirectoryEntry(
  organizationId: string
): Promise<ApiResult<OrganizationDirectoryEntryResponseData>> {
  return apiResult.get<OrganizationDirectoryEntryResponseData>(
    `/organization/directory/${encodeURIComponent(organizationId)}`
  )
}
