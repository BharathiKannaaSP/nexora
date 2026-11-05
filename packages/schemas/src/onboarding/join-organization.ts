import { z } from "zod"
import {
  PERMISSION_MODULES,
  modulePermissionsSchema,
  type PermissionModuleCode,
} from "./become-admin"

/**
 * The modules that apply inside an organization. COUNTRY_MANAGEMENT and
 * ORGANIZATION_MANAGEMENT are platform-admin modules (the latter reviews
 * every organization's requests and private files), so no organization
 * member, not even its creator, gets them.
 */
export const ORGANIZATION_PERMISSION_MODULES = PERMISSION_MODULES.filter(
  (module): module is Exclude<
    PermissionModuleCode,
    "COUNTRY_MANAGEMENT" | "ORGANIZATION_MANAGEMENT"
  > => module !== "COUNTRY_MANAGEMENT" && module !== "ORGANIZATION_MANAGEMENT"
)

export const JOIN_ORGANIZATION_TEXT_FIELD_MAX_LENGTH = 100
export const JOIN_ORGANIZATION_MESSAGE_MAX_LENGTH = 1000

export interface JoinOrganizationValidationMessages {
  organizationRequired: string
  jobTitleRequired: string
  textFieldTooLong: string
  messageTooLong: string
  workEmailInvalid: string
  joiningDateInvalid: string
  permissionsRequired: string
  permissionsNotAllowed: string
}

type Messages = Partial<JoinOrganizationValidationMessages>

// Optional free text; blank means none.
const optionalText = (max: number, message?: string) =>
  z.string().trim().max(max, message).optional()

/**
 * POST /onboarding/organization-request with `type: "JOIN"`. `permissions`
 * is what the member asks for in the organization, e.g.
 * { PRODUCT_MANAGEMENT: ["VIEW", "EDIT"] }: like a become-admin request, but
 * for one organization, so not keyed by country.
 */
export const createJoinOrganizationRequestSchema = (messages: Messages = {}) =>
  z
    .object({
      type: z.literal("JOIN"),
      organizationId: z.string().trim().min(1, messages.organizationRequired),
      jobTitle: z
        .string()
        .trim()
        .min(1, messages.jobTitleRequired)
        .max(
          JOIN_ORGANIZATION_TEXT_FIELD_MAX_LENGTH,
          messages.textFieldTooLong
        ),
      department: optionalText(
        JOIN_ORGANIZATION_TEXT_FIELD_MAX_LENGTH,
        messages.textFieldTooLong
      ),
      employeeId: optionalText(
        JOIN_ORGANIZATION_TEXT_FIELD_MAX_LENGTH,
        messages.textFieldTooLong
      ),
      reportingManager: optionalText(
        JOIN_ORGANIZATION_TEXT_FIELD_MAX_LENGTH,
        messages.textFieldTooLong
      ),
      workEmail: z
        .union([z.literal(""), z.email(messages.workEmailInvalid)])
        .optional(),
      // "YYYY-MM-DD"; blank means none.
      joiningDate: z
        .union([z.literal(""), z.iso.date(messages.joiningDateInvalid)])
        .optional(),
      message: optionalText(
        JOIN_ORGANIZATION_MESSAGE_MAX_LENGTH,
        messages.messageTooLong
      ),
      permissions: modulePermissionsSchema,
    })
    .superRefine(({ permissions }, ctx) => {
      const picked = Object.entries(permissions).filter(
        ([, actions]) => actions && actions.length > 0
      )

      if (picked.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["permissions"],
          message: messages.permissionsRequired,
        })
      }

      for (const [module] of picked) {
        if (
          !(ORGANIZATION_PERMISSION_MODULES as readonly string[]).includes(
            module
          )
        ) {
          ctx.addIssue({
            code: "custom",
            path: ["permissions", module],
            message: messages.permissionsNotAllowed,
          })
        }
      }
    })

export type JoinOrganizationRequestInput = z.output<
  ReturnType<typeof createJoinOrganizationRequestSchema>
>
