import {
  postcodeValidator,
  postcodeValidatorExistsForCountry,
} from "postcode-validator"
import { z } from "zod"

/**
 * Stored on OrganizationRequest.proposedIndustry. A fixed catalog kept in
 * code, like the permission modules; labels live in the admin app.
 */
export const ORGANIZATION_INDUSTRIES = [
  "FASHION_APPAREL",
  "RETAIL",
  "ECOMMERCE",
  "HEALTH_BEAUTY",
  "ELECTRONICS",
  "HOME_FURNITURE",
  "MANUFACTURING",
  "TECHNOLOGY",
  "LOGISTICS",
  "EDUCATION",
  "OTHER",
] as const

export type OrganizationIndustry = (typeof ORGANIZATION_INDUSTRIES)[number]

/** Stored on OrganizationRequest.proposedSize: headcount bands. */
export const ORGANIZATION_SIZES = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1001+",
] as const

export type OrganizationSize = (typeof ORGANIZATION_SIZES)[number]

export const ORGANIZATION_NAME_MAX_LENGTH = 100
export const ORGANIZATION_SLUG_MIN_LENGTH = 3
export const ORGANIZATION_SLUG_MAX_LENGTH = 50
export const ORGANIZATION_DESCRIPTION_MIN_LENGTH = 20
export const ORGANIZATION_DESCRIPTION_MAX_LENGTH = 1000
export const ORGANIZATION_REGISTRATION_NUMBER_MAX_LENGTH = 50

export const ORGANIZATION_LOGO_MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB
export const ORGANIZATION_DOCUMENTS_MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

// No SVG: it can carry scripts.
export const ORGANIZATION_LOGO_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const

export const ORGANIZATION_DOCUMENTS_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "image/png",
  "image/jpeg",
  "image/webp",
] as const

/** The form's document slots and the OrganizationDocumentType each is saved as. */
export const ORGANIZATION_DOCUMENT_SLOTS = {
  // e.g. a certificate of incorporation.
  businessRegistration: "BUSINESS_REGISTRATION",
  // e.g. a GST, VAT or tax certificate.
  taxRegistrationCertificate: "TAX_DOCUMENT",
  // e.g. a utility bill or lease agreement.
  addressProof: "PROOF_OF_ADDRESS",
  additionalDocument: "OTHER",
} as const

export type OrganizationDocumentSlot = keyof typeof ORGANIZATION_DOCUMENT_SLOTS

// Lowercase words joined by single hyphens, e.g. "acme-retail"; it becomes
// part of the organization's URL, so it can't start or end with a hyphen.
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

// Tax IDs differ per country (GSTIN, VAT, EIN…); the backend checks the exact
// format. Here: letters, digits and common separators only.
const TAX_ID_PATTERN = /^[A-Z0-9][A-Z0-9 ./-]{3,29}$/i

/** Turns a name into a slug suggestion, e.g. "Acme Retail Ltd." → "acme-retail-ltd". */
export const toOrganizationSlug = (name: string) =>
  name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, ORGANIZATION_SLUG_MAX_LENGTH)
    .replace(/-+$/, "")

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export interface CreateOrganizationValidationMessages {
  organizationNameRequired: string
  organizationNameTooLong: string
  organizationSlugRequired: string
  organizationSlugMinLength: string
  organizationSlugTooLong: string
  organizationSlugPattern: string
  organizationLogoRequired: string
  organizationLogoTooLarge: string
  organizationLogoWrongFormat: string
  organizationDocumentRequired: string
  organizationDocumentTooLarge: string
  organizationDocumentWrongFormat: string
  organizationSizeRequired: string
  organizationIndustryTypeRequired: string
  organizationCountryRequired: string
  organizationWebsiteInvalid: string
  organizationDescriptionRequired: string
  organizationDescriptionMinLength: string
  organizationDescriptionTooLong: string
  organizationTaxDetailsRequired: string
  organizationTaxDetailsInvalid: string
  organizationRegistrationNumberTooLong: string
  organizationIncorporationDateInvalid: string
  addressLine1Required: string
  cityRequired: string
  stateRequired: string
  postalCodeRequired: string
  postalCodeInvalid: string
}

// The service passes none: it only needs the rules, not the wording.
type Messages = Partial<CreateOrganizationValidationMessages>

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

/** An optional field where "" means "not given". */
const blankOr = <T extends z.ZodType>(schema: T) =>
  z.union([z.literal(""), schema]).optional()

/**
 * A file in the request body, as POST /media/uploads/complete returned it.
 * A resubmit that keeps a file sends the same values again. contentType and
 * sizeBytes are for display only: a signed URL serves what's really stored.
 */
const submittedFileSchema = z.object({
  key: z.string().min(1).max(1024),
  originalFileName: z.string().trim().min(1).max(255),
  contentType: z.string().min(1).max(255),
  sizeBytes: z.number().int().nonnegative(),
})

export type SubmittedFile = z.infer<typeof submittedFileSchema>

/**
 * A file uploaded on an earlier submit, put back in the form when the user
 * returns to it. It was checked when it was uploaded, and is sent again as is.
 */
export type SavedFile = SubmittedFile

export const isSavedFile = (value: unknown): value is SavedFile =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as SavedFile).key === "string" &&
  typeof (value as SavedFile).originalFileName === "string"

/**
 * A form file field: a newly picked File, checked for type and size, or a
 * SavedFile kept from the last submit.
 */
const fileSchema = (
  rule: { mimeTypes: readonly string[]; maxBytes: number },
  messages: { required?: string; wrongFormat?: string; tooLarge?: string }
) =>
  z
    .custom<File | SavedFile>(
      (value) => value instanceof File || isSavedFile(value),
      { message: messages.required }
    )
    .superRefine((value, ctx) => {
      if (!(value instanceof File)) return

      if (!rule.mimeTypes.includes(value.type)) {
        ctx.addIssue({ code: "custom", message: messages.wrongFormat })
      } else if (value.size > rule.maxBytes) {
        ctx.addIssue({ code: "custom", message: messages.tooLarge })
      }
    })

/** The document slots, with one schema for every file in them. */
const documentsSchema = <T extends z.ZodType>(file: T) =>
  z.object({
    businessRegistration: file,
    taxRegistrationCertificate: file,
    addressProof: file,
    // The form clears a file field with null (undefined would bring back its
    // default, the saved file); it leaves the request as undefined.
    additionalDocument: file.nullish().transform((value) => value ?? undefined),
  })

// ---------------------------------------------------------------------------
// Fields shared by the form and the request body
// ---------------------------------------------------------------------------

/**
 * Named as the OrganizationRequest columns they're stored in. Kept apart from
 * the postal-code check because Zod can't `.extend()` a refined schema.
 */
const organizationFields = (m: Messages) =>
  z.object({
    proposedName: z
      .string()
      .trim()
      .min(1, m.organizationNameRequired)
      .max(ORGANIZATION_NAME_MAX_LENGTH, m.organizationNameTooLong),

    proposedSlug: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, m.organizationSlugRequired)
      .min(ORGANIZATION_SLUG_MIN_LENGTH, m.organizationSlugMinLength)
      .max(ORGANIZATION_SLUG_MAX_LENGTH, m.organizationSlugTooLong)
      .regex(SLUG_PATTERN, m.organizationSlugPattern),

    proposedDescription: z
      .string()
      .trim()
      .min(1, m.organizationDescriptionRequired)
      .min(
        ORGANIZATION_DESCRIPTION_MIN_LENGTH,
        m.organizationDescriptionMinLength
      )
      .max(
        ORGANIZATION_DESCRIPTION_MAX_LENGTH,
        m.organizationDescriptionTooLong
      ),

    // ISO 3166-1 alpha-2, as in GET /auth/countries. The postal code is
    // checked against it.
    proposedCountryCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2}$/, m.organizationCountryRequired),

    proposedIndustry: z.enum(
      ORGANIZATION_INDUSTRIES,
      m.organizationIndustryTypeRequired
    ),

    proposedSize: z.enum(ORGANIZATION_SIZES, m.organizationSizeRequired),

    proposedWebsite: blankOr(
      z.url({
        protocol: /^https?$/,
        hostname: z.regexes.domain,
        message: m.organizationWebsiteInvalid,
      })
    ),

    // JSON column. Countries may add more fields; taxId is the one every
    // country has.
    proposedTaxDetails: z.object({
      taxId: z
        .string()
        .trim()
        .min(1, m.organizationTaxDetailsRequired)
        .regex(TAX_ID_PATTERN, m.organizationTaxDetailsInvalid),
      // e.g. a CIN in India, a company number in the UK.
      registrationNumber: z
        .string()
        .trim()
        .max(
          ORGANIZATION_REGISTRATION_NUMBER_MAX_LENGTH,
          m.organizationRegistrationNumberTooLong
        )
        .optional(),
      // "YYYY-MM-DD".
      incorporationDate: blankOr(
        z.iso.date(m.organizationIncorporationDateInvalid)
      ),
    }),

    // JSON column.
    proposedAddress: z.object({
      addressLine1: z.string().trim().min(1, m.addressLine1Required),
      addressLine2: z.string().trim().optional(),
      city: z.string().trim().min(1, m.cityRequired),
      state: z.string().trim().min(1, m.stateRequired),
      // Required only where the country uses postal codes; see below.
      postalCode: z.string().trim(),
    }),
  })

/**
 * The postal code must match the country, e.g. 6 digits for India, "SW1A 1AA"
 * for the UK. Countries without postal codes (e.g. the UAE) may leave it blank.
 */
const checkPostalCode =
  (m: Messages) =>
  (
    data: {
      proposedCountryCode: string
      proposedAddress: { postalCode: string }
    },
    ctx: z.RefinementCtx
  ) => {
    const country = data.proposedCountryCode
    const { postalCode } = data.proposedAddress

    if (!postcodeValidatorExistsForCountry(country)) return

    const message = !postalCode
      ? m.postalCodeRequired
      : !postcodeValidator(postalCode, country)
        ? m.postalCodeInvalid
        : null

    if (message !== null) {
      ctx.addIssue({
        code: "custom",
        path: ["proposedAddress", "postalCode"],
        message,
      })
    }
  }

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

/** The create-organization form in the admin app: the logo and documents are picked Files. */
export const createCreateOrganizationSchema = (m: Messages = {}) =>
  organizationFields(m)
    .extend({
      proposedLogo: fileSchema(
        {
          mimeTypes: ORGANIZATION_LOGO_MIME_TYPES,
          maxBytes: ORGANIZATION_LOGO_MAX_SIZE_BYTES,
        },
        {
          required: m.organizationLogoRequired,
          wrongFormat: m.organizationLogoWrongFormat,
          tooLarge: m.organizationLogoTooLarge,
        }
      ),
      // Checked by the admin team before the organization is approved.
      proposedDocuments: documentsSchema(
        fileSchema(
          {
            mimeTypes: ORGANIZATION_DOCUMENTS_ALLOWED_MIME_TYPES,
            maxBytes: ORGANIZATION_DOCUMENTS_MAX_FILE_SIZE,
          },
          {
            required: m.organizationDocumentRequired,
            wrongFormat: m.organizationDocumentWrongFormat,
            tooLarge: m.organizationDocumentTooLarge,
          }
        )
      ),
    })
    .superRefine(checkPostalCode(m))

/**
 * POST /onboarding/organization-request with `type: "CREATE"`: the form's
 * fields, with the logo and documents as the keys they were uploaded to.
 * media-service checks the files themselves when they're claimed.
 */
export const createCreateOrganizationRequestSchema = (m: Messages = {}) =>
  organizationFields(m)
    .extend({
      type: z.literal("CREATE"),
      proposedLogoKey: submittedFileSchema.shape.key,
      proposedDocuments: documentsSchema(submittedFileSchema),
    })
    .superRefine(checkPostalCode(m))

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** What the form holds while it's being filled in. */
export type CreateOrganizationFormValues = z.input<
  ReturnType<typeof createCreateOrganizationSchema>
>

/** What the admin app sends to POST /onboarding/organization-request. */
export type CreateOrganizationRequestBody = z.input<
  ReturnType<typeof createCreateOrganizationRequestSchema>
>

/** The parsed body onboarding-service works with. */
export type CreateOrganizationRequestInput = z.output<
  ReturnType<typeof createCreateOrganizationRequestSchema>
>
