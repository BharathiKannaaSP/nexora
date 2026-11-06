"use server"

import type { OrganizationDirectoryResponseData } from "@nexora/shared/types/organization"

import { apiResult, type ApiResult } from "../result"

export interface SearchOrganizationsQuery {
  /** Matches the name, case-insensitively; blank lists every organization. */
  search?: string
  /** ISO 3166-1 alpha-2, e.g. "IN". */
  country?: string
  /** Defaults to 20, at most 50. */
  limit?: number
}

/**
 * ACTIVE organizations a user can ask to join, sorted by name. Only what a
 * non-member may see (see OrganizationDirectoryEntry).
 */
export async function searchOrganizations({
  search,
  country,
  limit,
}: SearchOrganizationsQuery = {}): Promise<
  ApiResult<OrganizationDirectoryResponseData>
> {
  return apiResult.get<OrganizationDirectoryResponseData>(
    "/organization/directory",
    { query: { search: search?.trim() || undefined, country, limit } }
  )
}
