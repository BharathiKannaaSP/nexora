// `data` of organization-service responses, as they arrive over JSON.

/**
 * One ACTIVE organization in the directory a user picks from when asking to
 * join. Only what a non-member may see: no tax details, address or files.
 */
export interface OrganizationDirectoryEntry {
  id: string
  name: string
  slug: string
  /** ISO 3166-1 alpha-2, e.g. "IN". */
  countryCode: string
  /** One of ORGANIZATION_INDUSTRIES. */
  industry: string
  /** ACTIVE memberships. */
  memberCount: number
}

/**
 * GET /organization/directory?search=&country=&limit=. Sorted by name;
 * `search` matches the name, case-insensitively.
 */
export interface OrganizationDirectoryResponseData {
  organizations: OrganizationDirectoryEntry[]
}

/** GET /organization/directory/:organizationId: one directory entry, or 404. */
export interface OrganizationDirectoryEntryResponseData {
  organization: OrganizationDirectoryEntry
}
