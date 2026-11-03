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

export const ORGANIZATION_LOGO_MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB
// No SVG: it can carry scripts.
export const ORGANIZATION_LOGO_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const

// Lowercase words joined by single hyphens, e.g. "acme-retail"; it becomes
// part of the organization's URL, so it can't start or end with a hyphen.
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

// Tax IDs differ per country (GSTIN, VAT, EIN…); the backend checks the exact
// format. Here: letters, digits and common separators only.
const TAX_ID_PATTERN = /^[A-Z0-9][A-Z0-9 ./-]{3,29}$/i

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
  organizationSizeRequired: string
  organizationIndustryTypeRequired: string
  organizationCountryRequired: string
  organizationWebsiteInvalid: string
  organizationDescriptionRequired: string
  organizationDescriptionMinLength: string
  organizationDescriptionTooLong: string
  organizationTaxDetailsRequired: string
  organizationTaxDetailsInvalid: string
  addressLine1Required: string
  cityRequired: string
  stateRequired: string
  postalCodeRequired: string
  postalCodeInvalid: string
}

type Messages = Partial<CreateOrganizationValidationMessages>

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

/**
 * The fields shared by the form and the request body, named as the columns of
 * OrganizationRequest they're stored in. Kept apart from the cross-field
 * checks below because Zod can't `.extend()` or `.omit()` a schema that has
 * refinements.
 */
const organizationObjectSchema = (messages: Messages) =>
  z.object({
    proposedName: z
      .string()
      .trim()
      .min(1, messages.organizationNameRequired)
      .max(ORGANIZATION_NAME_MAX_LENGTH, messages.organizationNameTooLong),
    proposedSlug: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, messages.organizationSlugRequired)
      .min(ORGANIZATION_SLUG_MIN_LENGTH, messages.organizationSlugMinLength)
      .max(ORGANIZATION_SLUG_MAX_LENGTH, messages.organizationSlugTooLong)
      .regex(SLUG_PATTERN, messages.organizationSlugPattern),
    proposedDescription: z
      .string()
      .trim()
      .min(1, messages.organizationDescriptionRequired)
      .min(
        ORGANIZATION_DESCRIPTION_MIN_LENGTH,
        messages.organizationDescriptionMinLength
      )
      .max(
        ORGANIZATION_DESCRIPTION_MAX_LENGTH,
        messages.organizationDescriptionTooLong
      ),
    // ISO 3166-1 alpha-2, uppercase, as in GET /auth/countries. The address
    // and tax details are checked against it.
    proposedCountryCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2}$/, messages.organizationCountryRequired),
    proposedIndustry: z.enum(
      ORGANIZATION_INDUSTRIES,
      messages.organizationIndustryTypeRequired
    ),
    proposedSize: z.enum(ORGANIZATION_SIZES, messages.organizationSizeRequired),
    // Optional; blank means none.
    proposedWebsite: z
      .union([
        z.literal(""),
        z.url({
          protocol: /^https?$/,
          hostname: z.regexes.domain,
          message: messages.organizationWebsiteInvalid,
        }),
      ])
      .optional(),
    // JSON column. Countries may add more fields; taxId is the one every
    // country has.
    proposedTaxDetails: z.object({
      taxId: z
        .string()
        .trim()
        .min(1, messages.organizationTaxDetailsRequired)
        .regex(TAX_ID_PATTERN, messages.organizationTaxDetailsInvalid),
    }),
    // JSON column.
    proposedAddress: z.object({
      addressLine1: z.string().trim().min(1, messages.addressLine1Required),
      addressLine2: z.string().trim().optional(),
      city: z.string().trim().min(1, messages.cityRequired),
      state: z.string().trim().min(1, messages.stateRequired),
      // Required only where the country uses postal codes; see below.
      postalCode: z.string().trim(),
    }),
  })

/**
 * The postal code must match the organization's country, e.g. 6 digits for
 * India, "SW1A 1AA" for the UK. Countries without postal codes (e.g. the
 * UAE) may leave it blank.
 */
const refineOrganization =
  (messages: Messages) =>
  (
    data: {
      proposedCountryCode: string
      proposedAddress: { postalCode: string }
    },
    ctx: z.RefinementCtx
  ) => {
    const country = data.proposedCountryCode
    const { postalCode } = data.proposedAddress

    if (!country || !postcodeValidatorExistsForCountry(country)) return

    if (!postalCode) {
      ctx.addIssue({
        code: "custom",
        path: ["proposedAddress", "postalCode"],
        message: messages.postalCodeRequired,
      })
    } else if (!postcodeValidator(postalCode, country)) {
      ctx.addIssue({
        code: "custom",
        path: ["proposedAddress", "postalCode"],
        message: messages.postalCodeInvalid,
      })
    }
  }

/** The create-organization onboarding form. proposedLogo is the picked File. */
export const createCreateOrganizationSchema = (messages: Messages = {}) =>
  organizationObjectSchema(messages)
    .extend({
      proposedLogo: z
        .instanceof(File, { message: messages.organizationLogoRequired })
        .refine(
          (file) =>
            (ORGANIZATION_LOGO_MIME_TYPES as readonly string[]).includes(
              file.type
            ),
          messages.organizationLogoWrongFormat
        )
        .refine(
          (file) => file.size <= ORGANIZATION_LOGO_MAX_SIZE_BYTES,
          messages.organizationLogoTooLarge
        ),
    })
    .superRefine(refineOrganization(messages))

export type CreateOrganizationFormValues = z.input<
  ReturnType<typeof createCreateOrganizationSchema>
>
