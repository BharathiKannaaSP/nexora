import { z } from "zod"

/**
 * The modules an admin can request access to. A fixed catalog kept in code,
 * not seeded into a table: onboarding-service stores these codes on each
 * AdminAccessRequestPermission.moduleCode.
 */
export const PERMISSION_MODULES = [
  "COUNTRY_MANAGEMENT",
  "USER_MANAGEMENT",
  // Reviewing organization requests and seeing their private files.
  "ORGANIZATION_MANAGEMENT",
  "PRODUCT_MANAGEMENT",
  "INVENTORY_MANAGEMENT",
  "BILLING_MANAGEMENT",
  "ANALYTICS_MANAGEMENT",
] as const

export type PermissionModuleCode = (typeof PERMISSION_MODULES)[number]

/** What can be done within a module, in the order the form shows them. */
export const PERMISSION_ACTIONS = ["VIEW", "CREATE", "EDIT", "DELETE"] as const

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number]

export const ADMIN_REQUEST_MAX_COUNTRIES = 3

export const ADMIN_REQUEST_JUSTIFICATION_MAX_LENGTH = 1000

/** For jobTitle, department and currentOrganizationName. */
export const ADMIN_REQUEST_TEXT_FIELD_MAX_LENGTH = 100

export interface BecomeAdminValidationMessages {
  jobTitleRequired: string
  jobTitleTooLong: string
  departmentRequired: string
  departmentTooLong: string
  currentOrganizationNameRequired: string
  currentOrganizationNameTooLong: string
  justificationRequired: string
  justificationTooLong: string
  countriesRequired: string
  countriesTooMany: string
  permissionsRequired: string
}

/**
 * The actions picked per module, e.g. { USER_MANAGEMENT: ["VIEW", "EDIT"] }.
 * Modules with nothing picked may be left out.
 */
export const modulePermissionsSchema = z.partialRecord(
  z.enum(PERMISSION_MODULES),
  z.array(z.enum(PERMISSION_ACTIONS))
)

/**
 * POST /onboarding/become-admin-request. `permissions` is keyed by country code
 * ("IN"); entries for countries that aren't in `countries` are ignored, so
 * unticking a country keeps its picks in case it's ticked again.
 */
export const createBecomeAdminSchema = (
  messages: BecomeAdminValidationMessages
) =>
  z
    .object({
      jobTitle: z
        .string()
        .trim()
        .min(1, messages.jobTitleRequired)
        .max(ADMIN_REQUEST_TEXT_FIELD_MAX_LENGTH, messages.jobTitleTooLong),
      department: z
        .string()
        .trim()
        .min(1, messages.departmentRequired)
        .max(ADMIN_REQUEST_TEXT_FIELD_MAX_LENGTH, messages.departmentTooLong),
      currentOrganizationName: z
        .string()
        .trim()
        .min(1, messages.currentOrganizationNameRequired)
        .max(
          ADMIN_REQUEST_TEXT_FIELD_MAX_LENGTH,
          messages.currentOrganizationNameTooLong
        ),
      justification: z
        .string()
        .trim()
        .min(1, messages.justificationRequired)
        .max(
          ADMIN_REQUEST_JUSTIFICATION_MAX_LENGTH,
          messages.justificationTooLong
        ),
      // ISO 3166-1 alpha-2, uppercase, as in GET /auth/countries.
      countries: z
        .array(z.string().regex(/^[A-Z]{2}$/))
        .min(1, messages.countriesRequired)
        .max(ADMIN_REQUEST_MAX_COUNTRIES, messages.countriesTooMany),
      permissions: z.record(z.string(), modulePermissionsSchema),
    })
    .superRefine(({ countries, permissions }, ctx) => {
      // Every picked country needs at least one action in some module.
      for (const country of countries) {
        const hasAction = Object.values(permissions[country] ?? {}).some(
          (actions) => actions && actions.length > 0
        )

        if (!hasAction) {
          ctx.addIssue({
            code: "custom",
            path: ["permissions", country],
            message: messages.permissionsRequired,
          })
        }
      }
    })

export type BecomeAdminFormValues = z.input<
  ReturnType<typeof createBecomeAdminSchema>
>

export type BecomeAdminRequestInput = z.output<
  ReturnType<typeof createBecomeAdminSchema>
>
