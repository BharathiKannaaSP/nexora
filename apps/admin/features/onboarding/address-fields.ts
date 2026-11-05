import { Home, type LucideIcon } from "lucide-react"
import type { useTranslations } from "next-intl"

import { countryUsesPostalCode } from "@nexora/schemas/user-details/user-details-update"

import type { FieldConfig } from "@/components/forms/form-types"

interface AddressFieldsOptions {
  t: ReturnType<typeof useTranslations<"onboarding">>
  /** Put before each field name, e.g. "proposedAddress.". */
  namePrefix?: string
  /** Put before each autocomplete token, e.g. "organization ". */
  autoCompletePrefix?: string
  postalCodeIcon?: LucideIcon
  /** The picked country; the postal code rule follows it. */
  countryCode?: string
}

/** Address lines, city, state and postal code, as EntityForm fields. */
export const addressFields = ({
  t,
  namePrefix = "",
  autoCompletePrefix = "",
  postalCodeIcon = Home,
  countryCode,
}: AddressFieldsOptions): FieldConfig[] =>
  (
    [
      { name: "addressLine1", required: true, autoComplete: "address-line1" },
      { name: "addressLine2", required: false, autoComplete: "address-line2" },
      { name: "city", required: true, autoComplete: "address-level2" },
      { name: "state", required: true, autoComplete: "address-level1" },
      {
        name: "postalCode",
        // Countries without postal codes (e.g. the UAE) may leave it blank.
        required: !countryCode || countryUsesPostalCode(countryCode),
        autoComplete: "postal-code",
      },
    ] as const
  ).map(({ name, required, autoComplete }) => ({
    name: `${namePrefix}${name}`,
    label: t(`chooseYourPathForm.fields.${name}`),
    type: "text",
    required,
    colSpan: name === "postalCode" ? 2 : undefined,
    icon: name === "postalCode" ? postalCodeIcon : Home,
    inputProps: { autoComplete: `${autoCompletePrefix}${autoComplete}` },
  }))
