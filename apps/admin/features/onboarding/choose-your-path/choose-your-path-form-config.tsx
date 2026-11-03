import { createChooseYourPathSchema } from "@nexora/schemas/onboarding/choose-your-path"
import { countryUsesPostalCode } from "@nexora/schemas/user-details/user-details-update"
import {
  Building,
  Calendar,
  Clock,
  Globe,
  Home,
  Pencil,
  Settings,
  UsersRound,
} from "lucide-react"
import type { Country } from "@nexora/shared/types/country"
import type { useTranslations } from "next-intl"
import type { EntityFormConfig } from "@/components/forms/form-types"
import { getCountryLanguages } from "@/lib/i18n/config"

interface ChooseYourPathFormConfigOptions {
  t: ReturnType<typeof useTranslations<"onboarding">>
}

interface ChooseYourPathFormFieldOptions extends ChooseYourPathFormConfigOptions {
  countries: Country[]
  /** The picked bioCountry; phone and time zone follow it. */
  selectedCountry?: Country

  urlCountry: string
  /** Shown under the country when saving will move the app to another /country. */
  countrySwitchNotice?: string
  /** The page's language; country names are shown and sorted in it. */
  lang: string
  regionNames: Intl.DisplayNames
}

// One collator for the whole sort; localeCompare(…, lang) builds one per call.
const byName = (lang: string) => {
  const collator = new Intl.Collator(lang)
  return (a: { name: string }, b: { name: string }) =>
    collator.compare(a.name, b.name)
}

export const createChooseYourPathFormConfig = ({
  t,
  countries,
  urlCountry,
  selectedCountry,
  countrySwitchNotice,
  lang,
  regionNames,
}: ChooseYourPathFormFieldOptions): EntityFormConfig => ({
  sections: [
    {
      title: t("pages.choosePath.title"),
      description: t("pages.choosePath.description"),
      isLastField: true,
      fields: [
        "selectedPath",
        "bioCountry",
        "languageCode",
        "phoneNumber",
        "timeZone",
        "dob",
        "gender",
        "bio",
        "addressLine1",
        "addressLine2",
        "city",
        "state",
        "postalCode",
      ],
    },
  ],
  fields: [
    {
      name: "selectedPath",
      label: t("chooseYourPathForm.fields.selectedPath"),
      type: "radio-group",
      required: true,
      colSpan: 2,
      options: [
        {
          value: "BECOME_ADMIN",
          label: t("chooseYourPathForm.paths.becomeAdmin.label"),
          description: t("chooseYourPathForm.paths.becomeAdmin.description"),
          icon: Settings,
        },
        {
          value: "CREATE_ORGANIZATION",
          label: t("chooseYourPathForm.paths.createOrganization.label"),
          description: t(
            "chooseYourPathForm.paths.createOrganization.description"
          ),
          icon: Building,
        },
        {
          value: "JOIN_ORGANIZATION",
          label: t("chooseYourPathForm.paths.joinOrganization.label"),
          description: t(
            "chooseYourPathForm.paths.joinOrganization.description"
          ),
          icon: UsersRound,
        },
      ],
    },
    {
      name: "bioCountry",
      label: t("chooseYourPathForm.fields.bioCountry"),
      type: "combobox",
      required: true,
      defaultValue: urlCountry,
      description: countrySwitchNotice,
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
      name: "languageCode",
      label: t("chooseYourPathForm.fields.languageCode"),
      type: "select",
      icon: Globe,
      disabled: !selectedCountry,
      placeholder: selectedCountry
        ? undefined
        : t("chooseYourPathForm.hints.selectCountryFirst"),
      options: selectedCountry
        ? getCountryLanguages(selectedCountry.code.toLowerCase()).map(
            ({ code, language }) => ({ value: code, label: language })
          )
        : [],
    },
    {
      name: "phoneNumber",
      label: t("chooseYourPathForm.fields.phoneNumber"),
      type: "phone-number-select",
      required: true,
      // The calling code comes from the picked country.
      disabled: !selectedCountry,
      placeholder: selectedCountry
        ? undefined
        : t("chooseYourPathForm.hints.selectCountryFirst"),
      inputProps: { autoComplete: "tel" },
    },
    {
      name: "timeZone",
      label: t("chooseYourPathForm.fields.timezone"),
      type: "select",
      required: true,
      icon: Clock,
      disabled: !selectedCountry,
      placeholder: selectedCountry
        ? undefined
        : t("chooseYourPathForm.hints.selectCountryFirst"),
      options: (selectedCountry?.timezones ?? []).map((timezone) => ({
        value: timezone,
        label: timezone.replaceAll("_", " "),
      })),
    },
    {
      name: "dob",
      label: t("chooseYourPathForm.fields.dob"),
      type: "date",
      required: true,
      icon: Calendar,
      placeholder: "YYYY-MM-DD",
      inputProps: { autoComplete: "bday" },
    },
    {
      name: "gender",
      label: t("chooseYourPathForm.fields.gender"),
      type: "select",
      required: true,
      options: [
        { value: "MALE", label: t("chooseYourPathForm.genderOptions.male") },
        {
          value: "FEMALE",
          label: t("chooseYourPathForm.genderOptions.female"),
        },
        { value: "OTHER", label: t("chooseYourPathForm.genderOptions.other") },
        {
          value: "PREFER_NOT_TO_SAY",
          label: t("chooseYourPathForm.genderOptions.preferNotToSay"),
        },
      ],
    },
    {
      name: "bio",
      label: t("chooseYourPathForm.fields.bio"),
      type: "textarea",
      required: true,
      colSpan: 2,
      icon: Pencil,
    },
    {
      name: "addressLine1",
      label: t("chooseYourPathForm.fields.addressLine1"),
      type: "text",
      required: true,
      icon: Home,
      inputProps: { autoComplete: "address-line1" },
    },
    {
      name: "addressLine2",
      label: t("chooseYourPathForm.fields.addressLine2"),
      type: "text",
      icon: Home,
      inputProps: { autoComplete: "address-line2" },
    },
    {
      name: "city",
      label: t("chooseYourPathForm.fields.city"),
      type: "text",
      required: true,
      icon: Home,
      inputProps: { autoComplete: "address-level2" },
    },
    {
      name: "state",
      label: t("chooseYourPathForm.fields.state"),
      type: "text",
      required: true,
      icon: Home,
      inputProps: { autoComplete: "address-level1" },
    },
    {
      name: "postalCode",
      label: t("chooseYourPathForm.fields.postalCode"),
      type: "text",
      // Countries without postal codes (e.g. the UAE) may leave it blank.
      required: !selectedCountry || countryUsesPostalCode(selectedCountry.code),
      colSpan: 2,
      icon: Home,
      inputProps: { autoComplete: "postal-code" },
    },
  ],
})

export const createChooseYourPathFormSchema = (
  t: ChooseYourPathFormConfigOptions["t"]
) =>
  createChooseYourPathSchema({
    selectedPathRequired: t(
      "chooseYourPathForm.validation.selectedPathRequired"
    ),
    phoneNumberRequired: t("chooseYourPathForm.validation.phoneNumberRequired"),
    phoneNumberInvalid: t("chooseYourPathForm.validation.phoneNumberInvalid"),
    dobRequired: t("chooseYourPathForm.validation.dobRequired"),
    genderRequired: t("chooseYourPathForm.validation.genderRequired"),
    bioCountryRequired: t("chooseYourPathForm.validation.bioCountryRequired"),
    bioRequired: t("chooseYourPathForm.validation.bioRequired"),
    bioTooLong: t("chooseYourPathForm.validation.bioTooLong"),
    addressLine1Required: t(
      "chooseYourPathForm.validation.addressLine1Required"
    ),
    cityRequired: t("chooseYourPathForm.validation.cityRequired"),
    stateRequired: t("chooseYourPathForm.validation.stateRequired"),
    postalCodeRequired: t("chooseYourPathForm.validation.postalCodeRequired"),
    postalCodeInvalid: t("chooseYourPathForm.validation.postalCodeInvalid"),
    timeZoneRequired: t("chooseYourPathForm.validation.timeZoneRequired"),
  })
