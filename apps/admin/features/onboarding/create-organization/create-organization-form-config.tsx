import {
  createCreateOrganizationSchema,
  ORGANIZATION_DESCRIPTION_MAX_LENGTH,
  ORGANIZATION_DESCRIPTION_MIN_LENGTH,
  ORGANIZATION_DOCUMENTS_ALLOWED_MIME_TYPES,
  ORGANIZATION_DOCUMENTS_MAX_FILE_SIZE,
  ORGANIZATION_INDUSTRIES,
  ORGANIZATION_LOGO_MAX_SIZE_BYTES,
  ORGANIZATION_LOGO_MIME_TYPES,
  ORGANIZATION_NAME_MAX_LENGTH,
  ORGANIZATION_REGISTRATION_NUMBER_MAX_LENGTH,
  ORGANIZATION_SIZES,
  ORGANIZATION_SLUG_MAX_LENGTH,
  ORGANIZATION_SLUG_MIN_LENGTH,
  type CreateOrganizationFormValues,
  type OrganizationIndustry,
} from "@nexora/schemas/onboarding/create-organization"
import { countryUsesPostalCode } from "@nexora/schemas/user-details/user-details-update"
import type { Country } from "@nexora/shared/types/country"
import {
  Building2,
  Calendar,
  Factory,
  FileText,
  FileUp,
  Globe,
  Hash,
  Home,
  Link,
  Pencil,
  UsersRound,
} from "lucide-react"
import type { useTranslations } from "next-intl"
import type { EntityFormConfig } from "@/components/forms/form-types"

export interface CreateOrganizationFormConfigOptions {
  t: ReturnType<typeof useTranslations<"onboarding">>
}

interface CreateOrganizationFormFieldOptions extends CreateOrganizationFormConfigOptions {
  /** The countries Nexora is offered in; the organization is set up in one. */
  countries: Country[]
  /** The picked countryCode; the postal code rule follows it. */
  selectedCountryCode?: string
  /** The page's language; country names are shown and sorted in it. */
  lang: string
  regionNames: Intl.DisplayNames
  /** Deletes a saved logo or document for good when its X is clicked. */
  onDeleteSavedFile?: (value: unknown) => Promise<boolean>
}

// Labels live in onboarding.json under createOrganizationForm.industries.*.
export const INDUSTRY_KEYS = {
  FASHION_APPAREL: "fashionApparel",
  RETAIL: "retail",
  ECOMMERCE: "ecommerce",
  HEALTH_BEAUTY: "healthBeauty",
  ELECTRONICS: "electronics",
  HOME_FURNITURE: "homeFurniture",
  MANUFACTURING: "manufacturing",
  TECHNOLOGY: "technology",
  LOGISTICS: "logistics",
  EDUCATION: "education",
  OTHER: "other",
} as const satisfies Record<OrganizationIndustry, string>

const LOGO_MAX_SIZE_MB = ORGANIZATION_LOGO_MAX_SIZE_BYTES / (1024 * 1024)
const DOCUMENT_MAX_SIZE_MB =
  ORGANIZATION_DOCUMENTS_MAX_FILE_SIZE / (1024 * 1024)

// The upload cards, in order. Labels live in onboarding.json under
// createOrganizationForm.documents.*.
export const DOCUMENT_FIELDS = [
  { name: "businessRegistration", required: true },
  { name: "taxRegistrationCertificate", required: true },
  { name: "addressProof", required: true },
  { name: "additionalDocument", required: false },
] as const satisfies readonly {
  name: keyof CreateOrganizationFormValues["proposedDocuments"]
  required: boolean
}[]

// One collator for the whole sort; localeCompare(…, lang) builds one per call.
const byName = (lang: string) => {
  const collator = new Intl.Collator(lang)
  return (a: { name: string }, b: { name: string }) =>
    collator.compare(a.name, b.name)
}

export const createOrganizationFormConfig = ({
  t,
  countries,
  selectedCountryCode,
  lang,
  regionNames,
  onDeleteSavedFile,
}: CreateOrganizationFormFieldOptions): EntityFormConfig => ({
  sections: [
    {
      title: t("createOrganizationForm.sections.details.title"),
      description: t("createOrganizationForm.sections.details.description"),
      fields: [
        "proposedName",
        "proposedSlug",
        "proposedLogo",
        "proposedIndustry",
        "proposedSize",
        "proposedWebsite",
        "proposedDescription",
      ],
    },
    {
      title: t("createOrganizationForm.sections.location.title"),
      description: t("createOrganizationForm.sections.location.description"),
      fields: [
        "proposedCountryCode",
        "proposedTaxDetails.taxId",
        "proposedTaxDetails.registrationNumber",
        "proposedTaxDetails.incorporationDate",
        "proposedAddress.addressLine1",
        "proposedAddress.addressLine2",
        "proposedAddress.city",
        "proposedAddress.state",
        "proposedAddress.postalCode",
      ],
    },
    {
      title: t("createOrganizationForm.sections.documents.title"),
      description: t("createOrganizationForm.sections.documents.description"),
      isLastField: true,
      columns: 4,
      fields: DOCUMENT_FIELDS.map(({ name }) => `proposedDocuments.${name}`),
    },
  ],
  fields: [
    {
      name: "proposedName",
      label: t("createOrganizationForm.fields.name"),
      type: "text",
      required: true,
      icon: Building2,
      placeholder: t("createOrganizationForm.placeholders.name"),
      inputProps: {
        autoComplete: "organization",
        maxLength: ORGANIZATION_NAME_MAX_LENGTH,
      },
    },
    {
      name: "proposedSlug",
      label: t("createOrganizationForm.fields.slug"),
      type: "text",
      required: true,
      icon: Link,
      placeholder: "acme-retail",
      description: t("createOrganizationForm.hints.slug"),
      inputProps: {
        autoComplete: "off",
        spellCheck: false,
        maxLength: ORGANIZATION_SLUG_MAX_LENGTH,
      },
    },
    {
      name: "proposedLogo",
      label: t("createOrganizationForm.fields.logo"),
      type: "file-upload",
      required: true,
      placeholder: t("createOrganizationForm.placeholders.logo"),
      description: t("createOrganizationForm.hints.logo", {
        maxMb: LOGO_MAX_SIZE_MB,
      }),
      maxFiles: 1,
      maxFileSize: ORGANIZATION_LOGO_MAX_SIZE_BYTES,
      accept: [...ORGANIZATION_LOGO_MIME_TYPES],
      onDeleteSavedFile,
    },
    {
      name: "proposedIndustry",
      label: t("createOrganizationForm.fields.industry"),
      type: "select",
      required: true,
      icon: Factory,
      placeholder: t("createOrganizationForm.placeholders.industry"),
      options: ORGANIZATION_INDUSTRIES.map((industry) => ({
        value: industry,
        label: t(
          `createOrganizationForm.industries.${INDUSTRY_KEYS[industry]}`
        ),
      })),
    },
    {
      name: "proposedSize",
      label: t("createOrganizationForm.fields.size"),
      type: "select",
      required: true,
      icon: UsersRound,
      placeholder: t("createOrganizationForm.placeholders.size"),
      // e.g. "11–50 employees"; the bands themselves aren't translated.
      options: ORGANIZATION_SIZES.map((size) => ({
        value: size,
        label: t("createOrganizationForm.sizeOption", {
          range: size.replace("-", "–"),
        }),
      })),
    },
    {
      name: "proposedWebsite",
      label: t("createOrganizationForm.fields.website"),
      type: "text",
      icon: Globe,
      placeholder: "https://example.com",
      inputProps: { type: "url", autoComplete: "url", inputMode: "url" },
    },
    {
      name: "proposedDescription",
      label: t("createOrganizationForm.fields.description"),
      type: "textarea",
      required: true,
      colSpan: 2,
      icon: Pencil,
      placeholder: t("createOrganizationForm.placeholders.description"),
      description: t("createOrganizationForm.hints.description", {
        min: ORGANIZATION_DESCRIPTION_MIN_LENGTH,
        max: ORGANIZATION_DESCRIPTION_MAX_LENGTH,
      }),
    },
    {
      name: "proposedCountryCode",
      label: t("chooseYourPathForm.fields.bioCountry"),
      type: "combobox",
      required: true,
      // e.g. "Inde" on /fr/fr; English when the runtime has no name.
      options: countries
        .map((country) => ({
          value: country.code,
          name: regionNames.of(country.code) ?? country.name,
          flag: country.flag,
        }))
        .sort(byName(lang))
        .map(({ value, name, flag }) => ({ value, label: `${flag} ${name}` })),
    },
    {
      name: "proposedTaxDetails.taxId",
      label: t("createOrganizationForm.fields.taxId"),
      type: "text",
      required: true,
      icon: FileText,
      placeholder: t("createOrganizationForm.placeholders.taxId"),
      description: t("createOrganizationForm.hints.taxId"),
      inputProps: { autoComplete: "off", spellCheck: false },
    },
    {
      name: "proposedTaxDetails.registrationNumber",
      label: t("createOrganizationForm.fields.registrationNumber"),
      type: "text",
      icon: FileText,
      placeholder: t("createOrganizationForm.placeholders.registrationNumber"),
      inputProps: {
        autoComplete: "off",
        spellCheck: false,
        maxLength: ORGANIZATION_REGISTRATION_NUMBER_MAX_LENGTH,
      },
    },
    {
      name: "proposedTaxDetails.incorporationDate",
      label: t("createOrganizationForm.fields.incorporationDate"),
      type: "date",
      icon: Calendar,
      placeholder: "YYYY-MM-DD",
    },
    {
      name: "proposedAddress.addressLine1",
      label: t("chooseYourPathForm.fields.addressLine1"),
      type: "text",
      required: true,
      icon: Home,
      inputProps: { autoComplete: "organization address-line1" },
    },
    {
      name: "proposedAddress.addressLine2",
      label: t("chooseYourPathForm.fields.addressLine2"),
      type: "text",
      icon: Home,
      inputProps: { autoComplete: "organization address-line2" },
    },
    {
      name: "proposedAddress.city",
      label: t("chooseYourPathForm.fields.city"),
      type: "text",
      required: true,
      icon: Home,
      inputProps: { autoComplete: "organization address-level2" },
    },
    {
      name: "proposedAddress.state",
      label: t("chooseYourPathForm.fields.state"),
      type: "text",
      required: true,
      icon: Home,
      inputProps: { autoComplete: "organization address-level1" },
    },
    {
      name: "proposedAddress.postalCode",
      label: t("chooseYourPathForm.fields.postalCode"),
      type: "text",
      // Countries without postal codes (e.g. the UAE) may leave it blank.
      required:
        !selectedCountryCode || countryUsesPostalCode(selectedCountryCode),
      colSpan: 2,
      icon: Hash,
      inputProps: { autoComplete: "organization postal-code" },
    },
    ...DOCUMENT_FIELDS.map(({ name, required }) => ({
      name: `proposedDocuments.${name}`,
      label: t(`createOrganizationForm.documents.${name}.label`),
      type: "file-upload" as const,
      required,
      uploadVariant: "compact" as const,
      uploadIcon: FileUp,
      placeholder: t(`createOrganizationForm.documents.${name}.hint`),
      description: t("createOrganizationForm.hints.document", {
        maxMb: DOCUMENT_MAX_SIZE_MB,
      }),
      maxFiles: 1,
      maxFileSize: ORGANIZATION_DOCUMENTS_MAX_FILE_SIZE,
      accept: [...ORGANIZATION_DOCUMENTS_ALLOWED_MIME_TYPES],
      onDeleteSavedFile,
    })),
  ],
})

// The limits come from the schema so the messages can't drift from the rules.
export const createCreateOrganizationFormSchema = (
  t: CreateOrganizationFormConfigOptions["t"]
) =>
  createCreateOrganizationSchema({
    organizationNameRequired: t(
      "createOrganizationForm.validation.organizationNameRequired"
    ),
    organizationNameTooLong: t(
      "createOrganizationForm.validation.organizationNameTooLong",
      { max: ORGANIZATION_NAME_MAX_LENGTH }
    ),
    organizationSlugRequired: t(
      "createOrganizationForm.validation.organizationSlugRequired"
    ),
    organizationSlugMinLength: t(
      "createOrganizationForm.validation.organizationSlugMinLength",
      { min: ORGANIZATION_SLUG_MIN_LENGTH }
    ),
    organizationSlugTooLong: t(
      "createOrganizationForm.validation.organizationSlugTooLong",
      { max: ORGANIZATION_SLUG_MAX_LENGTH }
    ),
    organizationSlugPattern: t(
      "createOrganizationForm.validation.organizationSlugPattern"
    ),
    organizationLogoRequired: t(
      "createOrganizationForm.validation.organizationLogoRequired"
    ),
    organizationLogoTooLarge: t(
      "createOrganizationForm.validation.organizationLogoTooLarge",
      { maxMb: ORGANIZATION_LOGO_MAX_SIZE_BYTES / (1024 * 1024) }
    ),
    organizationLogoWrongFormat: t(
      "createOrganizationForm.validation.organizationLogoWrongFormat"
    ),
    organizationSizeRequired: t(
      "createOrganizationForm.validation.organizationSizeRequired"
    ),
    organizationIndustryTypeRequired: t(
      "createOrganizationForm.validation.organizationIndustryTypeRequired"
    ),
    organizationCountryRequired: t(
      "createOrganizationForm.validation.organizationCountryRequired"
    ),
    organizationWebsiteInvalid: t(
      "createOrganizationForm.validation.organizationWebsiteInvalid"
    ),
    organizationDescriptionRequired: t(
      "createOrganizationForm.validation.organizationDescriptionRequired"
    ),
    organizationDescriptionMinLength: t(
      "createOrganizationForm.validation.organizationDescriptionMinLength",
      { min: ORGANIZATION_DESCRIPTION_MIN_LENGTH }
    ),
    organizationDescriptionTooLong: t(
      "createOrganizationForm.validation.organizationDescriptionTooLong",
      { max: ORGANIZATION_DESCRIPTION_MAX_LENGTH }
    ),
    organizationTaxDetailsRequired: t(
      "createOrganizationForm.validation.organizationTaxDetailsRequired"
    ),
    organizationTaxDetailsInvalid: t(
      "createOrganizationForm.validation.organizationTaxDetailsInvalid"
    ),
    addressLine1Required: t(
      "createOrganizationForm.validation.addressLine1Required"
    ),
    cityRequired: t("createOrganizationForm.validation.cityRequired"),
    stateRequired: t("createOrganizationForm.validation.stateRequired"),
    postalCodeRequired: t(
      "createOrganizationForm.validation.postalCodeRequired"
    ),
    postalCodeInvalid: t("createOrganizationForm.validation.postalCodeInvalid"),
    organizationRegistrationNumberTooLong: t(
      "createOrganizationForm.validation.organizationRegistrationNumberTooLong",
      { max: ORGANIZATION_REGISTRATION_NUMBER_MAX_LENGTH }
    ),
    organizationIncorporationDateInvalid: t(
      "createOrganizationForm.validation.organizationIncorporationDateInvalid"
    ),
    organizationDocumentRequired: t(
      "createOrganizationForm.validation.organizationDocumentRequired"
    ),
    organizationDocumentTooLarge: t(
      "createOrganizationForm.validation.organizationDocumentTooLarge",
      { maxMb: DOCUMENT_MAX_SIZE_MB }
    ),
    organizationDocumentWrongFormat: t(
      "createOrganizationForm.validation.organizationDocumentWrongFormat"
    ),
  })
