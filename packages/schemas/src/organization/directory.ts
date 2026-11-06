import { z } from "zod"

export const ORGANIZATION_DIRECTORY_DEFAULT_LIMIT = 20
export const ORGANIZATION_DIRECTORY_MAX_LIMIT = 50
export const ORGANIZATION_DIRECTORY_SEARCH_MAX_LENGTH = 100

/**
 * GET /organization/directory?search=&country=&limit=. Every parameter is
 * optional: a blank `search` lists every organization, no `country` means
 * every country.
 */
export const organizationDirectoryQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(ORGANIZATION_DIRECTORY_SEARCH_MAX_LENGTH)
    .optional()
    .transform((value) => value || undefined),
  // ISO 3166-1 alpha-2, any case; blank means every country.
  country: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2}$/)
      .optional()
  ),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(ORGANIZATION_DIRECTORY_MAX_LIMIT)
    .default(ORGANIZATION_DIRECTORY_DEFAULT_LIMIT),
})

export type OrganizationDirectoryQuery = z.output<
  typeof organizationDirectoryQuerySchema
>
