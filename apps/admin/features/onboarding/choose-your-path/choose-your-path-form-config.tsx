import {
  Building,
  Calendar,
  Clock,
  Globe,
  Pencil,
  Settings,
  UsersRound,
} from "lucide-react"
import type { useTranslations } from "next-intl"

import { createChooseYourPathSchema } from "@nexora/schemas/onboarding/choose-your-path"
import type { Country } from "@nexora/shared/types/country"

import type { EntityFormConfig } from "@/components/forms/form-types"
import { getCountryLanguages } from "@/lib/i18n/config"

import { addressFields } from "../address-fields"
import { toCountryOptions } from "../country-options"

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
      options: toCountryOptions(countries, { lang, regionNames }),
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
    ...addressFields({ t, countryCode: selectedCountry?.code }),
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
