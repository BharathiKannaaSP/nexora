"use client"

import { useFormatter, useTranslations } from "next-intl"
import { useMemo, type ReactNode } from "react"

import type {
  PermissionAction,
  PermissionModuleCode,
} from "@nexora/schemas/onboarding/become-admin"
import { isSavedFile } from "@nexora/schemas/onboarding/create-organization"
import {
  JOIN_DOCUMENT_SLOTS,
  JOIN_ORGANIZATION_DEPARTMENTS,
  joinDocumentRulesFor,
  ORGANIZATION_PERMISSION_MODULES,
  type JoinDocumentSlot,
} from "@nexora/schemas/onboarding/join-organization"
import type {
  AdminAccessRequest,
  CreateOrganizationFormDetails,
  JoinOrganizationFormDetails,
} from "@nexora/shared/types/onboarding"
import type { OrganizationDirectoryEntry } from "@nexora/shared/types/organization"
import type { Gender } from "@nexora/shared/types/user"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@nexora/ui/components/card"

import { UploadedFilesTable } from "@/components/forms/uploaded-files-table"
import { OrganizationAvatar } from "@/components/organization/organization-avatar"
import { useBootstrap } from "@/features/bootstrap/bootstrap-provider"
import {
  ACTION_KEYS,
  MODULE_ICONS,
  MODULE_KEYS,
} from "@/features/onboarding/become-admin/become-admin-form-config"
import {
  DOCUMENT_FIELDS,
  INDUSTRY_KEYS,
} from "@/features/onboarding/create-organization/create-organization-form-config"
import { toCreateOrganizationFormDefaults } from "@/features/onboarding/create-organization/create-organization-form-defaults"
import { OrganizationMeta } from "@/features/onboarding/join-organization/join-organization-aside"
import {
  DEPARTMENT_KEYS,
  documentLabelKey,
  organizationIndustryName,
} from "@/features/onboarding/join-organization/join-organization-form-config"
import { toModulePermissions } from "@/features/onboarding/join-organization/join-organization-form-defaults"
import { useLocaleParams } from "@/hooks/use-locale-params"
import { useRegionNames } from "@/hooks/use-region-names"
import {
  toCountryPermissions,
  toOrderedPermissions,
} from "@/lib/auth/permissions"

// Labels live in onboarding.json under chooseYourPathForm.genderOptions.
const GENDER_KEYS = {
  MALE: "male",
  FEMALE: "female",
  OTHER: "other",
  PREFER_NOT_TO_SAY: "preferNotToSay",
} as const satisfies Record<Gender, string>

const Section = ({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) => (
  <section className="flex flex-col gap-3">
    <h3 className="font-semibold">{title}</h3>
    {children}
  </section>
)

/** Hides fields the user left empty, e.g. address line 2. */
const Fields = ({
  fields,
}: {
  fields: { label: string; value: ReactNode | null | undefined }[]
}) => (
  <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
    {fields
      .filter(
        ({ value }) => value !== null && value !== undefined && value !== ""
      )
      .map(({ label, value }) => (
        <div key={label} className="flex flex-col gap-1">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="font-medium wrap-break-word">{value}</dd>
        </div>
      ))}
  </dl>
)

/** Each module with its actions as chips, in the order given. */
const ModulePermissionList = ({
  modules,
}: {
  modules: { code: PermissionModuleCode; actions: PermissionAction[] }[]
}) => {
  const t = useTranslations("onboarding")

  return (
    <ul className="flex flex-col gap-3">
      {modules.map(({ code, actions }) => {
        const Icon = MODULE_ICONS[code]
        return (
          <li
            key={code}
            className="flex flex-wrap items-center justify-between gap-2"
          >
            <span className="flex items-center gap-2">
              <Icon
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              {t(`becomeAdminForm.modules.${MODULE_KEYS[code]}.label`)}
            </span>
            <span className="flex flex-wrap gap-1.5">
              {actions.map((action) => (
                <span
                  key={action}
                  className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                >
                  {t(`becomeAdminForm.actions.${ACTION_KEYS[action]}`)}
                </span>
              ))}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

/** Saved files only; the review never holds a newly picked File. */
const savedFile = (value: unknown) => (isSavedFile(value) ? value : undefined)

/** The CREATE_ORGANIZATION request, laid out like step 3 of the form. */
const OrganizationSections = ({
  request,
  regionNames,
}: {
  request: CreateOrganizationFormDetails
  regionNames: Intl.DisplayNames
}) => {
  const t = useTranslations("onboarding")
  const format = useFormatter()

  // The form's own parser: narrows the enums and reads the JSON columns.
  const values = toCreateOrganizationFormDefaults(request, "")
  const tax = values.proposedTaxDetails
  const address = values.proposedAddress

  const form = "createOrganizationForm" as const
  const userFields = "chooseYourPathForm.fields" as const

  const files = [
    {
      id: "proposedLogo",
      label: t(`${form}.fields.logo`),
      value: savedFile(values.proposedLogo),
    },
    ...DOCUMENT_FIELDS.map(({ name }) => ({
      id: name,
      label: t(`${form}.documents.${name}.label`),
      value: savedFile(values.proposedDocuments?.[name]),
    })),
  ]

  return (
    <>
      <Section title={t(`${form}.sections.details.title`)}>
        <Fields
          fields={[
            { label: t(`${form}.fields.name`), value: values.proposedName },
            { label: t(`${form}.fields.slug`), value: values.proposedSlug },
            {
              label: t(`${form}.fields.industry`),
              value:
                values.proposedIndustry &&
                t(
                  `${form}.industries.${INDUSTRY_KEYS[values.proposedIndustry]}`
                ),
            },
            {
              label: t(`${form}.fields.size`),
              value:
                values.proposedSize &&
                t(`${form}.sizeOption`, {
                  range: values.proposedSize.replace("-", "–"),
                }),
            },
            {
              label: t(`${form}.fields.website`),
              value: values.proposedWebsite && (
                <a
                  href={values.proposedWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {values.proposedWebsite}
                </a>
              ),
            },
          ]}
        />
        {values.proposedDescription && (
          <div className="flex flex-col gap-1">
            <p className="text-muted-foreground">
              {t(`${form}.fields.description`)}
            </p>
            <p className="whitespace-pre-line">{values.proposedDescription}</p>
          </div>
        )}
      </Section>

      <Section title={t(`${form}.sections.location.title`)}>
        <Fields
          fields={[
            {
              label: t(`${userFields}.bioCountry`),
              value:
                values.proposedCountryCode &&
                (regionNames.of(values.proposedCountryCode) ??
                  values.proposedCountryCode),
            },
            {
              label: t(`${userFields}.addressLine1`),
              value: address?.addressLine1,
            },
            {
              label: t(`${userFields}.addressLine2`),
              value: address?.addressLine2,
            },
            { label: t(`${userFields}.city`), value: address?.city },
            { label: t(`${userFields}.state`), value: address?.state },
            {
              label: t(`${userFields}.postalCode`),
              value: address?.postalCode,
            },
            { label: t(`${form}.fields.taxId`), value: tax?.taxId },
            {
              label: t(`${form}.fields.registrationNumber`),
              value: tax?.registrationNumber,
            },
            {
              label: t(`${form}.fields.incorporationDate`),
              // A calendar date; formatting it in the viewer's zone could
              // move it a day.
              value:
                tax?.incorporationDate &&
                format.dateTime(new Date(tax.incorporationDate), {
                  dateStyle: "long",
                  timeZone: "UTC",
                }),
            },
          ]}
        />
      </Section>

      {files.some(({ value }) => value) && (
        <Section title={t(`${form}.sections.documents.title`)}>
          {/* No onRemove: View and Download only. */}
          <UploadedFilesTable items={files} />
        </Section>
      )}
    </>
  )
}

const SLOT_BY_DOCUMENT_TYPE = Object.fromEntries(
  Object.entries(JOIN_DOCUMENT_SLOTS).map(([slot, type]) => [type, slot])
) as Record<string, JoinDocumentSlot>

/** The JOIN_ORGANIZATION request, laid out like step 3 of the form. */
const JoinSections = ({
  request,
  organization,
  documentCountryCode,
  regionNames,
}: {
  request: JoinOrganizationFormDetails
  /** From the directory; null when it couldn't be loaded. */
  organization: OrganizationDirectoryEntry | null
  /** The country whose document names apply, as on the form. */
  documentCountryCode: string
  regionNames: Intl.DisplayNames
}) => {
  const t = useTranslations("onboarding")
  const tPicker = useTranslations("common.organizationPicker")
  const format = useFormatter()

  const form = "joinOrganizationForm" as const
  const rules = joinDocumentRulesFor(documentCountryCode)
  const department = JOIN_ORGANIZATION_DEPARTMENTS.find(
    (value) => value === request.department
  )

  // Every saved file, named as the form named its slot.
  const files = request.proposedDocuments.flatMap((document) => {
    const slot = SLOT_BY_DOCUMENT_TYPE[document.documentType]
    if (!slot) return []
    const rule = rules.find((rule) => rule.slot === slot)
    const labelKey = documentLabelKey(rule ?? { slot, labelKey: "" })
    return [
      {
        id: slot,
        label: t(`${form}.documents.${labelKey}.label`),
        value: {
          key: document.objectKey,
          originalFileName: document.originalFileName,
          contentType: document.contentType,
          sizeBytes: document.sizeBytes,
        },
      },
    ]
  })

  const permissions = toModulePermissions(request.requestedPermissions)
  const modules = ORGANIZATION_PERMISSION_MODULES.flatMap((code) => {
    const actions = permissions[code]
    return actions ? [{ code, actions }] : []
  })

  return (
    <>
      <Section title={t("review.submittedInformation.organization")}>
        {organization ? (
          <div className="flex items-center gap-3">
            <OrganizationAvatar organization={organization} />
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="truncate font-medium">{organization.name}</p>
              <OrganizationMeta
                countryName={
                  regionNames.of(organization.countryCode) ??
                  organization.countryCode
                }
                industryName={organizationIndustryName(
                  t,
                  organization.industry
                )}
                members={tPicker("members", {
                  count: organization.memberCount,
                })}
              />
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">
            {t("review.submittedInformation.organizationUnavailable")}
          </p>
        )}
      </Section>

      <Section title={t(`${form}.sections.employment.title`)}>
        <Fields
          fields={[
            {
              label: t(`${form}.fields.employeeId`),
              value: request.employeeId,
            },
            { label: t(`${form}.fields.jobTitle`), value: request.jobTitle },
            {
              label: t(`${form}.fields.department`),
              value: department
                ? t(`${form}.departments.${DEPARTMENT_KEYS[department]}`)
                : request.department,
            },
            { label: t(`${form}.fields.workEmail`), value: request.workEmail },
            {
              label: t(`${form}.fields.joiningDate`),
              // A calendar date; formatting it in the viewer's zone could
              // move it a day.
              value:
                request.joiningDate &&
                format.dateTime(new Date(request.joiningDate), {
                  dateStyle: "long",
                  timeZone: "UTC",
                }),
            },
            {
              label: t(`${form}.fields.reportingManager`),
              value: request.reportingManager,
            },
          ]}
        />
      </Section>

      {request.message && (
        <Section title={t(`${form}.sections.reason.title`)}>
          <p className="whitespace-pre-line">{request.message}</p>
        </Section>
      )}

      {modules.length > 0 && (
        <Section title={t("review.submittedInformation.permissions")}>
          <div className="rounded-lg border p-4">
            <ModulePermissionList modules={modules} />
          </div>
        </Section>
      )}

      {request.additionalNotes && (
        <Section title={t(`${form}.sections.notes.title`)}>
          <p className="whitespace-pre-line">{request.additionalNotes}</p>
        </Section>
      )}

      {files.length > 0 && (
        <Section title={t(`${form}.sections.documents.title`)}>
          {/* No onRemove: View and Download only. */}
          <UploadedFilesTable items={files} />
        </Section>
      )}
    </>
  )
}

interface SubmittedInformationProps {
  adminAccessRequest: AdminAccessRequest | null
  organizationRequest: CreateOrganizationFormDetails | null
  joinRequest: JoinOrganizationFormDetails | null
  joinOrganization: OrganizationDirectoryEntry | null
}

const SubmittedInformation = ({
  adminAccessRequest,
  organizationRequest,
  joinRequest,
  joinOrganization,
}: SubmittedInformationProps) => {
  const t = useTranslations("onboarding")
  const format = useFormatter()
  const { account, user } = useBootstrap()
  const { country: urlCountry, lang } = useLocaleParams()

  const regionNames = useRegionNames(lang)
  const languageNames = useMemo(
    () => new Intl.DisplayNames([lang], { type: "language" }),
    [lang]
  )

  const fields = "chooseYourPathForm.fields" as const
  const adminFields = "becomeAdminForm.fields" as const

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-semibold">
          {t("review.submittedInformation.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-8">
        <Section title={t("review.submittedInformation.personal")}>
          <Fields
            fields={[
              {
                label: t("review.submittedInformation.name"),
                value: `${account.firstName} ${account.lastName}`,
              },
              {
                label: t("review.submittedInformation.email"),
                value: account.email,
              },
              { label: t(`${fields}.phoneNumber`), value: user?.phoneNumber },
              {
                label: t(`${fields}.dob`),
                // A calendar date; formatting it in the viewer's zone could
                // move it a day.
                value:
                  user?.dob &&
                  format.dateTime(new Date(user.dob), {
                    dateStyle: "long",
                    timeZone: "UTC",
                  }),
              },
              {
                label: t(`${fields}.gender`),
                value:
                  user?.gender &&
                  t(
                    `chooseYourPathForm.genderOptions.${GENDER_KEYS[user.gender]}`
                  ),
              },
              {
                label: t(`${fields}.bioCountry`),
                value: user?.bioCountry && regionNames.of(user.bioCountry),
              },
              { label: t(`${fields}.addressLine1`), value: user?.addressLine1 },
              { label: t(`${fields}.addressLine2`), value: user?.addressLine2 },
              { label: t(`${fields}.city`), value: user?.city },
              { label: t(`${fields}.state`), value: user?.state },
              { label: t(`${fields}.postalCode`), value: user?.postalCode },
              {
                label: t(`${fields}.languageCode`),
                value:
                  user?.languageCode && languageNames.of(user.languageCode),
              },
              { label: t(`${fields}.timezone`), value: user?.timezone },
            ]}
          />
          {user?.bio && (
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground">{t(`${fields}.bio`)}</p>
              <p className="whitespace-pre-line">{user.bio}</p>
            </div>
          )}
        </Section>

        {adminAccessRequest && (
          <>
            <Section title={t("becomeAdminForm.sections.role.title")}>
              <Fields
                fields={[
                  {
                    label: t(`${adminFields}.jobTitle`),
                    value: adminAccessRequest.jobTitle,
                  },
                  {
                    label: t(`${adminFields}.department`),
                    value: adminAccessRequest.department,
                  },
                  {
                    label: t(`${adminFields}.currentOrganizationName`),
                    value: adminAccessRequest.currentOrganizationName,
                  },
                ]}
              />
            </Section>

            <Section title={t("becomeAdminForm.sections.justification.title")}>
              <p className="whitespace-pre-line">
                {adminAccessRequest.justification}
              </p>
            </Section>

            <Section title={t("review.submittedInformation.permissions")}>
              <div className="flex flex-col gap-4">
                {toOrderedPermissions(
                  toCountryPermissions(adminAccessRequest.requestedPermissions)
                ).map(({ countryCode, modules }) => (
                  <div
                    key={countryCode}
                    className="flex flex-col gap-3 rounded-lg border p-4"
                  >
                    <p className="font-medium">
                      {regionNames.of(countryCode) ?? countryCode}
                    </p>
                    <ModulePermissionList modules={modules} />
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}

        {organizationRequest && (
          <OrganizationSections
            request={organizationRequest}
            regionNames={regionNames}
          />
        )}

        {joinRequest && (
          <JoinSections
            request={joinRequest}
            organization={joinOrganization}
            documentCountryCode={(user?.bioCountry || urlCountry).toUpperCase()}
            regionNames={regionNames}
          />
        )}
      </CardContent>
    </Card>
  )
}

export default SubmittedInformation
