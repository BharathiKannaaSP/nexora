import {
  ADMIN_REQUEST_MAX_COUNTRIES,
  ADMIN_REQUEST_TEXT_FIELD_MAX_LENGTH,
  createBecomeAdminSchema,
  PERMISSION_ACTIONS,
  PERMISSION_MODULES,
  type PermissionAction,
  type PermissionModuleCode,
} from "@nexora/schemas/onboarding/become-admin"
import {
  Boxes,
  Building2,
  ChartColumn,
  CreditCard,
  Crown,
  Globe,
  type LucideIcon,
  Package,
  Pencil,
  ShieldCheck,
  UsersRound,
} from "lucide-react"
import type { Country } from "@nexora/shared/types/country"
import type { useTranslations } from "next-intl"
import type { EntityFormConfig } from "@/components/forms/form-types"

interface BecomeAdminFormConfigOptions {
  t: ReturnType<typeof useTranslations<"onboarding">>
}

interface BecomeAdminFormFieldOptions extends BecomeAdminFormConfigOptions {
  /** The countries Nexora is offered in; only these can be requested. */
  countries: Country[]
  /** The ticked countries, in the order they were ticked. */
  selectedCountryCodes: string[]
  /**
   * The user's bioCountry when it can be requested; always ticked and can't
   * be unticked. Start the form with it in `countries`.
   */
  lockedCountryCode?: string
  /** The page's language; country names are shown in it. */
  lang: string
  regionNames: Intl.DisplayNames
}

// Labels and descriptions live in onboarding.json under the same keys.
export const MODULE_KEYS = {
  COUNTRY_MANAGEMENT: "country",
  USER_MANAGEMENT: "user",
  ORGANIZATION_MANAGEMENT: "organization",
  PRODUCT_MANAGEMENT: "product",
  INVENTORY_MANAGEMENT: "inventory",
  BILLING_MANAGEMENT: "billing",
  ANALYTICS_MANAGEMENT: "analytics",
} as const satisfies Record<PermissionModuleCode, string>

export const MODULE_ICONS: Record<PermissionModuleCode, LucideIcon> = {
  COUNTRY_MANAGEMENT: Globe,
  USER_MANAGEMENT: UsersRound,
  ORGANIZATION_MANAGEMENT: Building2,
  PRODUCT_MANAGEMENT: Package,
  INVENTORY_MANAGEMENT: Boxes,
  BILLING_MANAGEMENT: CreditCard,
  ANALYTICS_MANAGEMENT: ChartColumn,
}

export const ACTION_KEYS = {
  VIEW: "view",
  CREATE: "create",
  EDIT: "edit",
  DELETE: "delete",
} as const satisfies Record<PermissionAction, string>

export const createBecomeAdminFormConfig = ({
  t,
  countries,
  selectedCountryCodes,
  lockedCountryCode,
  lang,
  regionNames,
}: BecomeAdminFormFieldOptions): EntityFormConfig => {
  // e.g. "Inde" on /fr/fr; English when the runtime has no name.
  const countryName = (country: Country) =>
    regionNames.of(country.code) ?? country.name

  const collator = new Intl.Collator(lang)
  const countryOptions = countries
    .map((country) => ({
      value: country.code,
      label: `${country.flag} ${countryName(country)}`,
      description: country.code,
      disabled: country.code === lockedCountryCode,
      name: countryName(country),
    }))
    .sort((a, b) => collator.compare(a.name, b.name))
    .map(({ name: _name, ...option }) => option)

  const permissionGroups = selectedCountryCodes.flatMap((code) => {
    const country = countries.find((country) => country.code === code)
    return country
      ? [
          {
            value: country.code,
            label: `${country.flag} ${countryName(country)} (${country.code})`,
          },
        ]
      : []
  })

  return {
    title: t("becomeAdminForm.title"),
    description: t("becomeAdminForm.description"),
    sections: [
      {
        title: t("becomeAdminForm.sections.role.title"),
        description: t("becomeAdminForm.sections.role.description"),
        icon: Building2,
        isLastField: true,
        fields: ["jobTitle", "department", "currentOrganizationName"],
      },
      {
        title: t("becomeAdminForm.sections.justification.title"),
        description: t("becomeAdminForm.sections.justification.description"),
        icon: Pencil,
        isLastField: true,
        fields: ["justification"],
      },
      {
        title: t("becomeAdminForm.sections.countries.title"),
        description: t("becomeAdminForm.sections.countries.description", {
          max: ADMIN_REQUEST_MAX_COUNTRIES,
        }),
        icon: Globe,
        isLastField: true,
        fields: ["countries"],
      },
      {
        title: t("becomeAdminForm.sections.permissions.title"),
        description: t("becomeAdminForm.sections.permissions.description"),
        icon: ShieldCheck,
        isLastField: true,
        fields: ["permissions"],
      },
    ],
    fields: [
      {
        name: "jobTitle",
        label: t("becomeAdminForm.fields.jobTitle"),
        type: "text",
        required: true,
        placeholder: t("becomeAdminForm.placeholders.jobTitle"),
        inputProps: {
          autoComplete: "organization-title",
          maxLength: ADMIN_REQUEST_TEXT_FIELD_MAX_LENGTH,
        },
      },
      {
        name: "department",
        label: t("becomeAdminForm.fields.department"),
        type: "text",
        required: true,
        placeholder: t("becomeAdminForm.placeholders.department"),
        inputProps: { maxLength: ADMIN_REQUEST_TEXT_FIELD_MAX_LENGTH },
      },
      {
        name: "currentOrganizationName",
        label: t("becomeAdminForm.fields.currentOrganizationName"),
        type: "text",
        required: true,
        colSpan: 2,
        placeholder: t("becomeAdminForm.placeholders.currentOrganizationName"),
        inputProps: {
          autoComplete: "organization",
          maxLength: ADMIN_REQUEST_TEXT_FIELD_MAX_LENGTH,
        },
      },
      {
        name: "justification",
        label: t("becomeAdminForm.fields.justification"),
        type: "textarea",
        required: true,
        colSpan: 2,
        placeholder: t("becomeAdminForm.placeholders.justification"),
      },
      {
        name: "countries",
        label: t("becomeAdminForm.fields.countries"),
        type: "checkbox-group",
        required: true,
        colSpan: 2,
        direction: "row",
        maxItems: ADMIN_REQUEST_MAX_COUNTRIES,
        description: [
          t("becomeAdminForm.hints.countriesSelected", {
            count: selectedCountryCodes.length,
            max: ADMIN_REQUEST_MAX_COUNTRIES,
          }),
          lockedCountryCode && t("becomeAdminForm.hints.ownCountryLocked"),
        ]
          .filter(Boolean)
          .join(" "),
        options: countryOptions,
      },
      {
        name: "permissions",
        label: t("becomeAdminForm.fields.permissions"),
        type: "permission-matrix",
        required: true,
        colSpan: 2,
        disabled: permissionGroups.length === 0,
        description:
          permissionGroups.length === 0
            ? t("becomeAdminForm.hints.selectCountryFirst")
            : undefined,
        permissionMatrix: {
          groups: permissionGroups,
          moduleColumnLabel: t("becomeAdminForm.permissions.module"),
          selectedCountLabel: (count) =>
            t("becomeAdminForm.permissions.modulesSelected", { count }),
          modules: PERMISSION_MODULES.map((code) => ({
            value: code,
            label: t(`becomeAdminForm.modules.${MODULE_KEYS[code]}.label`),
            description: t(
              `becomeAdminForm.modules.${MODULE_KEYS[code]}.description`
            ),
            icon: MODULE_ICONS[code],
          })),
          actions: PERMISSION_ACTIONS.map((action) => ({
            value: action,
            label: t(`becomeAdminForm.actions.${ACTION_KEYS[action]}`),
          })),
        },
      },
    ],
  }
}

export const createBecomeAdminFormSchema = (
  t: BecomeAdminFormConfigOptions["t"]
) =>
  createBecomeAdminSchema({
    jobTitleRequired: t("becomeAdminForm.validation.jobTitleRequired"),
    jobTitleTooLong: t("becomeAdminForm.validation.jobTitleTooLong", {
      max: ADMIN_REQUEST_TEXT_FIELD_MAX_LENGTH,
    }),
    departmentRequired: t("becomeAdminForm.validation.departmentRequired"),
    departmentTooLong: t("becomeAdminForm.validation.departmentTooLong", {
      max: ADMIN_REQUEST_TEXT_FIELD_MAX_LENGTH,
    }),
    currentOrganizationNameRequired: t(
      "becomeAdminForm.validation.currentOrganizationNameRequired"
    ),
    currentOrganizationNameTooLong: t(
      "becomeAdminForm.validation.currentOrganizationNameTooLong",
      { max: ADMIN_REQUEST_TEXT_FIELD_MAX_LENGTH }
    ),
    justificationRequired: t(
      "becomeAdminForm.validation.justificationRequired"
    ),
    justificationTooLong: t("becomeAdminForm.validation.justificationTooLong"),
    countriesRequired: t("becomeAdminForm.validation.countriesRequired"),
    countriesTooMany: t("becomeAdminForm.validation.countriesTooMany", {
      max: ADMIN_REQUEST_MAX_COUNTRIES,
    }),
    permissionsRequired: t("becomeAdminForm.validation.permissionsRequired"),
  })
