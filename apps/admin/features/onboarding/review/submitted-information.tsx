"use client"

import { useBootstrap } from "@/features/bootstrap/bootstrap-provider"
import {
  ACTION_KEYS,
  MODULE_ICONS,
  MODULE_KEYS,
} from "@/features/onboarding/become-admin/become-admin-form-config"
import {
  PERMISSION_ACTIONS,
  PERMISSION_MODULES,
  type PermissionAction,
  type PermissionModuleCode,
} from "@nexora/schemas/onboarding/become-admin"
import type { AdminAccessRequest } from "@nexora/shared/types/onboarding"
import type { Gender } from "@nexora/shared/types/user"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@nexora/ui/components/card"
import { useFormatter, useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useMemo, type ReactNode } from "react"

// Labels live in onboarding.json under chooseYourPathForm.genderOptions.
const GENDER_KEYS = {
  MALE: "male",
  FEMALE: "female",
  OTHER: "other",
  PREFER_NOT_TO_SAY: "preferNotToSay",
} as const satisfies Record<Gender, string>

/**
 * A request's permission rows grouped as { [country]: { [module]: action[] } },
 * with modules and actions in the order the form shows them.
 */
const groupPermissions = (request: AdminAccessRequest) => {
  const byCountry = new Map<
    string,
    Map<PermissionModuleCode, Set<PermissionAction>>
  >()

  for (const {
    countryCode,
    moduleCode,
    accessLevel,
  } of request.requestedPermissions) {
    const modules = byCountry.get(countryCode) ?? new Map()
    byCountry.set(countryCode, modules)
    const actions = modules.get(moduleCode as PermissionModuleCode) ?? new Set()
    modules.set(moduleCode as PermissionModuleCode, actions)
    actions.add(accessLevel as PermissionAction)
  }

  return [...byCountry].map(([countryCode, modules]) => ({
    countryCode,
    modules: PERMISSION_MODULES.filter((code) => modules.has(code)).map(
      (code) => ({
        code,
        actions: PERMISSION_ACTIONS.filter((action) =>
          modules.get(code)?.has(action)
        ),
      })
    ),
  }))
}

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

interface SubmittedInformationProps {
  adminAccessRequest: AdminAccessRequest | null
}

const SubmittedInformation = ({
  adminAccessRequest,
}: SubmittedInformationProps) => {
  const t = useTranslations("onboarding")
  const format = useFormatter()
  const { account, user } = useBootstrap()
  const { lang } = useParams<{ lang: string }>()

  const regionNames = useMemo(
    () => new Intl.DisplayNames([lang], { type: "region" }),
    [lang]
  )
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
                {groupPermissions(adminAccessRequest).map(
                  ({ countryCode, modules }) => (
                    <div
                      key={countryCode}
                      className="flex flex-col gap-3 rounded-lg border p-4"
                    >
                      <p className="font-medium">
                        {regionNames.of(countryCode) ?? countryCode}
                      </p>
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
                                {t(
                                  `becomeAdminForm.modules.${MODULE_KEYS[code]}.label`
                                )}
                              </span>
                              <span className="flex flex-wrap gap-1.5">
                                {actions.map((action) => (
                                  <span
                                    key={action}
                                    className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                                  >
                                    {t(
                                      `becomeAdminForm.actions.${ACTION_KEYS[action]}`
                                    )}
                                  </span>
                                ))}
                              </span>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )
                )}
              </div>
            </Section>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default SubmittedInformation
