import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Calendar,
  CreditCard,
  FileCheck,
  FileText,
  Hash,
  IdCard,
  Lock,
  Mail,
  MessageSquareText,
  NotebookPen,
  ShieldCheck,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react"
import type { useTranslations } from "next-intl"
import type { ReactNode } from "react"

import {
  PERMISSION_ACTIONS,
  type PermissionModuleCode,
} from "@nexora/schemas/onboarding/become-admin"
import {
  ORGANIZATION_DOCUMENTS_ALLOWED_MIME_TYPES,
  ORGANIZATION_DOCUMENTS_MAX_FILE_SIZE,
  ORGANIZATION_INDUSTRIES,
  type OrganizationIndustry,
} from "@nexora/schemas/onboarding/create-organization"
import {
  createJoinOrganizationSchema,
  JOIN_ORGANIZATION_DEPARTMENTS,
  JOIN_ORGANIZATION_MESSAGE_MAX_LENGTH,
  JOIN_ORGANIZATION_NOTES_MAX_LENGTH,
  JOIN_ORGANIZATION_TEXT_FIELD_MAX_LENGTH,
  ORGANIZATION_PERMISSION_MODULES,
  type JoinDocumentRule,
  type JoinDocumentSlot,
  type JoinOrganizationDepartment,
} from "@nexora/schemas/onboarding/join-organization"
import { Banner } from "@nexora/ui/components/banner"

import type {
  CustomFieldRenderProps,
  EntityFormConfig,
} from "@/components/forms/form-types"

import {
  ACTION_KEYS,
  MODULE_ICONS,
  MODULE_KEYS,
} from "../become-admin/become-admin-form-config"
import { INDUSTRY_KEYS } from "../create-organization/create-organization-form-config"

type OnboardingTranslations = ReturnType<typeof useTranslations<"onboarding">>

export interface JoinOrganizationFormConfigOptions {
  t: OnboardingTranslations
}

interface JoinOrganizationFormFieldOptions extends JoinOrganizationFormConfigOptions {
  /** The documents the user's country asks for (joinDocumentRulesFor). */
  documentRules: readonly JoinDocumentRule[]
  /** The country the documents follow, by name, e.g. "India". */
  documentCountryName: string
  /** The organization search and cards, see OrganizationPicker. */
  renderOrganizationPicker: (props: CustomFieldRenderProps) => ReactNode
  /** Deletes a saved document for good when its X is clicked. */
  onDeleteSavedFile?: (value: unknown) => Promise<boolean>
}

// Labels live in onboarding.json under joinOrganizationForm.departments.*.
export const DEPARTMENT_KEYS = {
  OPERATIONS: "operations",
  SALES: "sales",
  MARKETING: "marketing",
  PRODUCT: "product",
  ENGINEERING: "engineering",
  DESIGN: "design",
  FINANCE: "finance",
  HUMAN_RESOURCES: "humanResources",
  CUSTOMER_SUPPORT: "customerSupport",
  LOGISTICS: "logistics",
  OTHER: "other",
} as const satisfies Record<JoinOrganizationDepartment, string>

// Labels live in onboarding.json under joinOrganizationForm.documents.*;
// joinDocumentRulesFor() names one per slot and country.
const DOCUMENT_LABEL_KEYS = [
  "aadhaar",
  "pan",
  "governmentId",
  "employeeIdCard",
  "offerLetter",
] as const

export type DocumentLabelKey = (typeof DOCUMENT_LABEL_KEYS)[number]

// Used when a rule names a label this app doesn't have yet.
const SLOT_LABEL_KEYS = {
  primaryIdentity: "governmentId",
  taxIdentity: "pan",
  employeeIdCard: "employeeIdCard",
  offerLetter: "offerLetter",
} as const satisfies Record<JoinDocumentSlot, DocumentLabelKey>

export const documentLabelKey = ({
  slot,
  labelKey,
}: Pick<JoinDocumentRule, "slot" | "labelKey">): DocumentLabelKey =>
  (DOCUMENT_LABEL_KEYS as readonly string[]).includes(labelKey)
    ? (labelKey as DocumentLabelKey)
    : SLOT_LABEL_KEYS[slot]

const DOCUMENT_ICONS: Record<JoinDocumentSlot, LucideIcon> = {
  primaryIdentity: IdCard,
  taxIdentity: CreditCard,
  employeeIdCard: BadgeCheck,
  offerLetter: FileText,
}

const DOCUMENT_MAX_SIZE_MB =
  ORGANIZATION_DOCUMENTS_MAX_FILE_SIZE / (1024 * 1024)

/** The modules a member can ask for, as the permission matrix rows. */
const permissionModules = (t: OnboardingTranslations) =>
  ORGANIZATION_PERMISSION_MODULES.map((code: PermissionModuleCode) => ({
    value: code,
    label: t(`becomeAdminForm.modules.${MODULE_KEYS[code]}.label`),
    description: t(`becomeAdminForm.modules.${MODULE_KEYS[code]}.description`),
    icon: MODULE_ICONS[code],
  }))

/** e.g. "ECOMMERCE" → "E-commerce"; an unknown value is shown as is. */
export const organizationIndustryName = (
  t: OnboardingTranslations,
  industry: string
) =>
  ORGANIZATION_INDUSTRIES.includes(industry as OrganizationIndustry)
    ? t(
        `createOrganizationForm.industries.${INDUSTRY_KEYS[industry as OrganizationIndustry]}`
      )
    : industry

export const joinOrganizationFormConfig = ({
  t,
  documentRules,
  documentCountryName,
  renderOrganizationPicker,
  onDeleteSavedFile,
}: JoinOrganizationFormFieldOptions): EntityFormConfig => ({
  title: t("joinOrganizationForm.title"),
  description: t("joinOrganizationForm.description"),
  icon: UsersRound,
  sections: [
    {
      title: t("joinOrganizationForm.sections.organization.title"),
      description: t("joinOrganizationForm.sections.organization.description"),
      icon: Building2,
      isLastField: true,
      fields: ["organizationId"],
    },
    {
      title: t("joinOrganizationForm.sections.employment.title"),
      description: t("joinOrganizationForm.sections.employment.description"),
      icon: BriefcaseBusiness,
      fields: [
        "employeeId",
        "jobTitle",
        "department",
        "workEmail",
        "joiningDate",
        "reportingManager",
      ],
    },
    {
      title: t("joinOrganizationForm.sections.documents.title"),
      description: t("joinOrganizationForm.sections.documents.description"),
      icon: FileCheck,
      isLastField: true,
      columns: 4,
      notice: (
        <Banner variant="info">
          {t.rich("joinOrganizationForm.documentsNotice", {
            country: documentCountryName,
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </Banner>
      ),
      footnote: (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="size-3.5 shrink-0" aria-hidden="true" />
          {t("joinOrganizationForm.documentsFootnote")}
        </p>
      ),
      fields: documentRules.map(({ slot }) => `proposedDocuments.${slot}`),
    },
    {
      title: t("joinOrganizationForm.sections.reason.title"),
      description: t("joinOrganizationForm.sections.reason.description"),
      icon: MessageSquareText,
      isLastField: true,
      fields: ["message"],
    },
    {
      title: t("joinOrganizationForm.sections.access.title"),
      description: t("joinOrganizationForm.sections.access.description"),
      icon: ShieldCheck,
      isLastField: true,
      fields: ["permissions"],
    },
    {
      title: t("joinOrganizationForm.sections.notes.title"),
      description: t("joinOrganizationForm.sections.notes.description"),
      icon: NotebookPen,
      isLastField: true,
      fields: ["additionalNotes"],
    },
  ],
  fields: [
    {
      name: "organizationId",
      label: t("joinOrganizationForm.fields.organization"),
      type: "custom",
      required: true,
      colSpan: 2,
      render: renderOrganizationPicker,
    },
    {
      name: "employeeId",
      label: t("joinOrganizationForm.fields.employeeId"),
      type: "text",
      icon: Hash,
      placeholder: t("joinOrganizationForm.placeholders.employeeId"),
      inputProps: {
        autoComplete: "off",
        maxLength: JOIN_ORGANIZATION_TEXT_FIELD_MAX_LENGTH,
      },
    },
    {
      name: "jobTitle",
      label: t("joinOrganizationForm.fields.jobTitle"),
      type: "text",
      required: true,
      icon: BriefcaseBusiness,
      placeholder: t("joinOrganizationForm.placeholders.jobTitle"),
      inputProps: {
        autoComplete: "organization-title",
        maxLength: JOIN_ORGANIZATION_TEXT_FIELD_MAX_LENGTH,
      },
    },
    {
      name: "department",
      label: t("joinOrganizationForm.fields.department"),
      type: "select",
      required: true,
      placeholder: t("joinOrganizationForm.placeholders.department"),
      options: JOIN_ORGANIZATION_DEPARTMENTS.map((department) => ({
        value: department,
        label: t(
          `joinOrganizationForm.departments.${DEPARTMENT_KEYS[department]}`
        ),
      })),
    },
    {
      name: "workEmail",
      label: t("joinOrganizationForm.fields.workEmail"),
      type: "email",
      required: true,
      icon: Mail,
      placeholder: t("joinOrganizationForm.placeholders.workEmail"),
      inputProps: { autoComplete: "work email", inputMode: "email" },
    },
    {
      name: "joiningDate",
      label: t("joinOrganizationForm.fields.joiningDate"),
      type: "date",
      icon: Calendar,
      placeholder: t("joinOrganizationForm.placeholders.joiningDate"),
    },
    {
      name: "reportingManager",
      label: t("joinOrganizationForm.fields.reportingManager"),
      type: "text",
      icon: UserRound,
      placeholder: t("joinOrganizationForm.placeholders.reportingManager"),
      inputProps: {
        autoComplete: "off",
        maxLength: JOIN_ORGANIZATION_TEXT_FIELD_MAX_LENGTH,
      },
    },
    ...documentRules.map((rule) => {
      const labelKey = documentLabelKey(rule)
      return {
        name: `proposedDocuments.${rule.slot}`,
        label: t(`joinOrganizationForm.documents.${labelKey}.label`),
        type: "file-upload" as const,
        required: rule.required,
        uploadVariant: "compact" as const,
        uploadIcon: DOCUMENT_ICONS[rule.slot],
        placeholder: t(`joinOrganizationForm.documents.${labelKey}.hint`),
        description: t("joinOrganizationForm.hints.document", {
          maxMb: DOCUMENT_MAX_SIZE_MB,
        }),
        maxFiles: 1,
        maxFileSize: ORGANIZATION_DOCUMENTS_MAX_FILE_SIZE,
        accept: [...ORGANIZATION_DOCUMENTS_ALLOWED_MIME_TYPES],
        onDeleteSavedFile,
      }
    }),
    {
      name: "message",
      label: t("joinOrganizationForm.fields.message"),
      type: "textarea",
      required: true,
      colSpan: 2,
      placeholder: t("joinOrganizationForm.placeholders.message"),
      characterLimit: JOIN_ORGANIZATION_MESSAGE_MAX_LENGTH,
    },
    {
      name: "permissions",
      label: t("joinOrganizationForm.fields.permissions"),
      type: "permission-matrix",
      required: true,
      colSpan: 2,
      permissionMatrix: {
        moduleColumnLabel: t("becomeAdminForm.permissions.module"),
        selectedCountLabel: (count) =>
          t("becomeAdminForm.permissions.modulesSelected", { count }),
        modules: permissionModules(t),
        actions: PERMISSION_ACTIONS.map((action) => ({
          value: action,
          label: t(`becomeAdminForm.actions.${ACTION_KEYS[action]}`),
        })),
      },
    },
    {
      name: "additionalNotes",
      label: t("joinOrganizationForm.fields.additionalNotes"),
      type: "textarea",
      colSpan: 2,
      placeholder: t("joinOrganizationForm.placeholders.additionalNotes"),
      characterLimit: JOIN_ORGANIZATION_NOTES_MAX_LENGTH,
    },
  ],
})

// The limits come from the schema so the messages can't drift from the rules.
export const createJoinOrganizationFormSchema = (
  t: JoinOrganizationFormConfigOptions["t"]
) =>
  createJoinOrganizationSchema({
    organizationRequired: t(
      "joinOrganizationForm.validation.organizationRequired"
    ),
    jobTitleRequired: t("joinOrganizationForm.validation.jobTitleRequired"),
    departmentRequired: t("joinOrganizationForm.validation.departmentRequired"),
    workEmailRequired: t("joinOrganizationForm.validation.workEmailRequired"),
    workEmailInvalid: t("joinOrganizationForm.validation.workEmailInvalid"),
    textFieldTooLong: t("joinOrganizationForm.validation.textFieldTooLong", {
      max: JOIN_ORGANIZATION_TEXT_FIELD_MAX_LENGTH,
    }),
    joiningDateInvalid: t("joinOrganizationForm.validation.joiningDateInvalid"),
    messageRequired: t("joinOrganizationForm.validation.messageRequired"),
    messageTooLong: t("joinOrganizationForm.validation.messageTooLong", {
      max: JOIN_ORGANIZATION_MESSAGE_MAX_LENGTH,
    }),
    notesTooLong: t("joinOrganizationForm.validation.notesTooLong", {
      max: JOIN_ORGANIZATION_NOTES_MAX_LENGTH,
    }),
    documentRequired: t("joinOrganizationForm.validation.documentRequired"),
    documentTooLarge: t("joinOrganizationForm.validation.documentTooLarge", {
      maxMb: DOCUMENT_MAX_SIZE_MB,
    }),
    documentWrongFormat: t(
      "joinOrganizationForm.validation.documentWrongFormat"
    ),
    permissionsRequired: t(
      "joinOrganizationForm.validation.permissionsRequired"
    ),
    permissionsNotAllowed: t(
      "joinOrganizationForm.validation.permissionsNotAllowed"
    ),
  })
