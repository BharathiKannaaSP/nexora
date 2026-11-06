import { z } from "zod"

import {
  modulePermissionsSchema,
  PERMISSION_MODULES,
  type PermissionModuleCode,
} from "./become-admin"
import {
  blankOr,
  fileSchema,
  ORGANIZATION_DOCUMENTS_ALLOWED_MIME_TYPES,
  ORGANIZATION_DOCUMENTS_MAX_FILE_SIZE,
  submittedFileSchema,
} from "./create-organization"

/**
 * The modules that apply inside an organization. COUNTRY_MANAGEMENT and
 * ORGANIZATION_MANAGEMENT are platform-admin modules (the latter reviews
 * every organization's requests and private files), so no organization
 * member, not even its creator, gets them.
 */
export const ORGANIZATION_PERMISSION_MODULES = PERMISSION_MODULES.filter(
  (
    module
  ): module is Exclude<
    PermissionModuleCode,
    "COUNTRY_MANAGEMENT" | "ORGANIZATION_MANAGEMENT"
  > => module !== "COUNTRY_MANAGEMENT" && module !== "ORGANIZATION_MANAGEMENT"
)

export const JOIN_ORGANIZATION_TEXT_FIELD_MAX_LENGTH = 100
export const JOIN_ORGANIZATION_MESSAGE_MAX_LENGTH = 500
export const JOIN_ORGANIZATION_NOTES_MAX_LENGTH = 300

/** Stored on OrganizationRequest.department. */
export const JOIN_ORGANIZATION_DEPARTMENTS = [
  "OPERATIONS",
  "SALES",
  "MARKETING",
  "PRODUCT",
  "ENGINEERING",
  "DESIGN",
  "FINANCE",
  "HUMAN_RESOURCES",
  "CUSTOMER_SUPPORT",
  "LOGISTICS",
  "OTHER",
] as const

export type JoinOrganizationDepartment =
  (typeof JOIN_ORGANIZATION_DEPARTMENTS)[number]

// ---------------------------------------------------------------------------
// Identity verification documents
// ---------------------------------------------------------------------------

/**
 * The document slots of a JOIN request and the OrganizationDocumentType each
 * is stored as. Every slot has its own type, so a saved request maps back to
 * its slots when the form is filled in again.
 */
export const JOIN_DOCUMENT_SLOTS = {
  // Aadhaar in India; a passport or national ID elsewhere.
  primaryIdentity: "IDENTITY_DOCUMENT",
  // PAN in India; not asked for elsewhere.
  taxIdentity: "TAX_DOCUMENT",
  employeeIdCard: "EMPLOYMENT_PROOF",
  offerLetter: "OFFER_LETTER",
} as const

export type JoinDocumentSlot = keyof typeof JOIN_DOCUMENT_SLOTS

export interface JoinDocumentRule {
  slot: JoinDocumentSlot
  required: boolean
  /**
   * Label key under onboarding.joinOrganizationForm.documents.*, e.g.
   * "aadhaar" or "governmentId". Same slot, country-specific name.
   */
  labelKey: string
}

const DEFAULT_JOIN_DOCUMENTS: readonly JoinDocumentRule[] = [
  { slot: "primaryIdentity", required: true, labelKey: "governmentId" },
  { slot: "employeeIdCard", required: false, labelKey: "employeeIdCard" },
  { slot: "offerLetter", required: false, labelKey: "offerLetter" },
]

/** Countries that ask for something other than DEFAULT_JOIN_DOCUMENTS. */
const JOIN_DOCUMENTS_BY_COUNTRY: Partial<
  Record<string, readonly JoinDocumentRule[]>
> = {
  IN: [
    { slot: "primaryIdentity", required: true, labelKey: "aadhaar" },
    { slot: "taxIdentity", required: true, labelKey: "pan" },
    { slot: "employeeIdCard", required: false, labelKey: "employeeIdCard" },
    { slot: "offerLetter", required: false, labelKey: "offerLetter" },
  ],
}

/**
 * The documents a user from `countryCode` (ISO alpha-2, any case) uploads,
 * in display order. Used by the form and by onboarding-service, so both ask
 * for the same files.
 */
export const joinDocumentRulesFor = (
  countryCode: string
): readonly JoinDocumentRule[] =>
  JOIN_DOCUMENTS_BY_COUNTRY[countryCode.toUpperCase()] ?? DEFAULT_JOIN_DOCUMENTS

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export interface JoinOrganizationValidationMessages {
  organizationRequired: string
  jobTitleRequired: string
  departmentRequired: string
  workEmailRequired: string
  workEmailInvalid: string
  textFieldTooLong: string
  joiningDateInvalid: string
  messageRequired: string
  messageTooLong: string
  notesTooLong: string
  documentRequired: string
  documentTooLarge: string
  documentWrongFormat: string
  permissionsRequired: string
  permissionsNotAllowed: string
}

// The service passes none: it only needs the rules, not the wording.
type Messages = Partial<JoinOrganizationValidationMessages>

const optionalText = (max: number, message?: string) =>
  z.string().trim().max(max, message).optional()

/** Fields shared by the form and the request body. */
const joinFields = (m: Messages) =>
  z.object({
    organizationId: z.string().trim().min(1, m.organizationRequired),
    employeeId: optionalText(
      JOIN_ORGANIZATION_TEXT_FIELD_MAX_LENGTH,
      m.textFieldTooLong
    ),
    jobTitle: z
      .string()
      .trim()
      .min(1, m.jobTitleRequired)
      .max(JOIN_ORGANIZATION_TEXT_FIELD_MAX_LENGTH, m.textFieldTooLong),
    department: z.enum(JOIN_ORGANIZATION_DEPARTMENTS, m.departmentRequired),
    workEmail: z
      .string()
      .trim()
      .min(1, m.workEmailRequired)
      .pipe(z.email(m.workEmailInvalid)),
    // "YYYY-MM-DD"; blank means none.
    joiningDate: blankOr(z.iso.date(m.joiningDateInvalid)),
    reportingManager: optionalText(
      JOIN_ORGANIZATION_TEXT_FIELD_MAX_LENGTH,
      m.textFieldTooLong
    ),
    // "Reason for joining".
    message: z
      .string()
      .trim()
      .min(1, m.messageRequired)
      .max(JOIN_ORGANIZATION_MESSAGE_MAX_LENGTH, m.messageTooLong),
    additionalNotes: optionalText(
      JOIN_ORGANIZATION_NOTES_MAX_LENGTH,
      m.notesTooLong
    ),
    /**
     * The country whose document list applies (joinDocumentRulesFor): the
     * user's own, from basic information.
     */
    documentCountryCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2}$/),
    // { PRODUCT_MANAGEMENT: ["VIEW", "EDIT"] }: like a become-admin request,
    // but for one organization, so not keyed by country.
    permissions: modulePermissionsSchema,
  })

/** At least one action, and only organization modules. */
const checkPermissions =
  (m: Messages) =>
  (
    { permissions }: { permissions: z.infer<typeof modulePermissionsSchema> },
    ctx: z.RefinementCtx
  ) => {
    const picked = Object.entries(permissions).filter(
      ([, actions]) => actions && actions.length > 0
    )

    if (picked.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["permissions"],
        message: m.permissionsRequired,
      })
    }

    for (const [module] of picked) {
      if (
        !(ORGANIZATION_PERMISSION_MODULES as readonly string[]).includes(module)
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["permissions", module],
          message: m.permissionsNotAllowed,
        })
      }
    }
  }

/** Every slot the country requires has a file; slots it doesn't use are empty. */
const checkDocuments =
  (m: Messages) =>
  (
    data: {
      documentCountryCode: string
      proposedDocuments: Partial<Record<JoinDocumentSlot, unknown>>
    },
    ctx: z.RefinementCtx
  ) => {
    const rules = joinDocumentRulesFor(data.documentCountryCode)

    for (const { slot, required } of rules) {
      if (required && !data.proposedDocuments[slot]) {
        ctx.addIssue({
          code: "custom",
          path: ["proposedDocuments", slot],
          message: m.documentRequired,
        })
      }
    }

    const used = new Set<string>(rules.map(({ slot }) => slot))
    for (const [slot, file] of Object.entries(data.proposedDocuments)) {
      if (file && !used.has(slot)) {
        ctx.addIssue({
          code: "custom",
          path: ["proposedDocuments", slot],
          message: m.documentRequired,
        })
      }
    }
  }

/**
 * Every slot is optional here; checkDocuments decides per country. The form
 * clears a file with null, which the request leaves out.
 */
const documentsSchema = <T extends z.ZodType>(file: T) => {
  const slot = file.nullish().transform((value) => value ?? undefined)
  return z.object({
    primaryIdentity: slot,
    taxIdentity: slot,
    employeeIdCard: slot,
    offerLetter: slot,
  })
}

/** The join-organization form in the admin app: documents are picked Files. */
export const createJoinOrganizationSchema = (m: Messages = {}) =>
  joinFields(m)
    .extend({
      proposedDocuments: documentsSchema(
        fileSchema(
          {
            mimeTypes: ORGANIZATION_DOCUMENTS_ALLOWED_MIME_TYPES,
            maxBytes: ORGANIZATION_DOCUMENTS_MAX_FILE_SIZE,
          },
          {
            required: m.documentRequired,
            wrongFormat: m.documentWrongFormat,
            tooLarge: m.documentTooLarge,
          }
        )
      ),
    })
    .superRefine(checkPermissions(m))
    .superRefine(checkDocuments(m))

/**
 * POST /onboarding/organization-request with `type: "JOIN"`: the form's
 * fields, with each document as the upload media-service returned.
 */
export const createJoinOrganizationRequestSchema = (m: Messages = {}) =>
  joinFields(m)
    .extend({
      type: z.literal("JOIN"),
      proposedDocuments: documentsSchema(submittedFileSchema),
    })
    .superRefine(checkPermissions(m))
    .superRefine(checkDocuments(m))

/** What the form holds while it's being filled in. */
export type JoinOrganizationFormValues = z.input<
  ReturnType<typeof createJoinOrganizationSchema>
>

/** What the admin app sends to POST /onboarding/organization-request. */
export type JoinOrganizationRequestBody = z.input<
  ReturnType<typeof createJoinOrganizationRequestSchema>
>

/** The parsed body onboarding-service works with. */
export type JoinOrganizationRequestInput = z.output<
  ReturnType<typeof createJoinOrganizationRequestSchema>
>
