import {
  ORGANIZATION_DOCUMENT_SLOTS,
  ORGANIZATION_INDUSTRIES,
  ORGANIZATION_SIZES,
  type CreateOrganizationFormValues,
  type OrganizationDocumentSlot,
  type SavedFile,
} from "@nexora/schemas/onboarding/create-organization"
import type {
  CreateOrganizationFormDetails,
  JsonValue,
} from "@nexora/shared/types/onboarding"
import type { DefaultValues } from "react-hook-form"

/** `value` if it's one of `options`, else undefined (the field starts empty). */
const oneOf = <T extends string>(
  options: readonly T[],
  value: string | null | undefined
): T | undefined =>
  options.includes(value as T) ? (value as T) : undefined

/** A string property of a JSON column, or "". */
const textIn = (json: JsonValue | null | undefined, key: string): string => {
  if (typeof json !== "object" || json === null || Array.isArray(json)) {
    return ""
  }
  const value = (json as Record<string, JsonValue>)[key]
  return typeof value === "string" ? value : ""
}

const SLOT_BY_DOCUMENT_TYPE = Object.fromEntries(
  Object.entries(ORGANIZATION_DOCUMENT_SLOTS).map(([slot, type]) => [
    type,
    slot,
  ])
) as Record<string, OrganizationDocumentSlot>

/**
 * Only the logo's key is stored. That's all a resubmit sends for it; the
 * name is just something to show in the field.
 */
const savedLogo = (key: string): SavedFile => ({
  key,
  originalFileName: `logo.${key.split(".").pop()}`,
  contentType: "",
  sizeBytes: 0,
})

/**
 * The form's starting values: the saved request when the user comes back to
 * step 3, else empty. Saved files go back into their fields as SavedFiles, so
 * they're kept unless the user picks new ones.
 */
export const toCreateOrganizationFormDefaults = (
  saved: CreateOrganizationFormDetails | null,
  fallbackCountryCode: string
): DefaultValues<CreateOrganizationFormValues> => {
  const documents: Partial<Record<OrganizationDocumentSlot, SavedFile>> = {}

  for (const document of saved?.proposedDocuments ?? []) {
    const slot = SLOT_BY_DOCUMENT_TYPE[document.documentType]
    if (!slot) continue

    documents[slot] = {
      key: document.objectKey,
      originalFileName: document.originalFileName,
      contentType: document.contentType,
      sizeBytes: document.sizeBytes,
    }
  }

  const tax = saved?.proposedTaxDetails
  const address = saved?.proposedAddress

  return {
    proposedName: saved?.proposedName ?? "",
    proposedSlug: saved?.proposedSlug ?? "",
    proposedDescription: saved?.proposedDescription ?? "",
    proposedCountryCode: saved?.proposedCountryCode ?? fallbackCountryCode,
    proposedIndustry: oneOf(ORGANIZATION_INDUSTRIES, saved?.proposedIndustry),
    proposedSize: oneOf(ORGANIZATION_SIZES, saved?.proposedSize),
    proposedWebsite: saved?.proposedWebsite ?? "",
    proposedTaxDetails: {
      taxId: textIn(tax, "taxId"),
      registrationNumber: textIn(tax, "registrationNumber"),
      incorporationDate: textIn(tax, "incorporationDate"),
    },
    proposedAddress: {
      addressLine1: textIn(address, "addressLine1"),
      addressLine2: textIn(address, "addressLine2"),
      city: textIn(address, "city"),
      state: textIn(address, "state"),
      postalCode: textIn(address, "postalCode"),
    },
    proposedLogo: saved?.proposedLogoObjectKey
      ? savedLogo(saved.proposedLogoObjectKey)
      : undefined,
    proposedDocuments: {
      businessRegistration: documents.businessRegistration,
      taxRegistrationCertificate: documents.taxRegistrationCertificate,
      addressProof: documents.addressProof,
      additionalDocument: documents.additionalDocument,
    },
  }
}
