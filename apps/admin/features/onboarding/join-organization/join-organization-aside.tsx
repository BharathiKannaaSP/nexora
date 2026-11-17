"use client"

import { CircleCheck } from "lucide-react"
import { useTranslations } from "next-intl"

import { ORGANIZATION_DOCUMENTS_MAX_FILE_SIZE } from "@nexora/schemas/onboarding/create-organization"
import type { OrganizationDirectoryEntry } from "@nexora/shared/types/organization"
import { Button } from "@nexora/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@nexora/ui/components/card"
import { cn } from "@nexora/ui/lib/utils"

import { OrganizationAvatar } from "@/components/organization/organization-avatar"

const NEXT_STEPS = ["submitted", "review", "verification", "approval"] as const

// "maxSize" comes between formats and encrypted; it takes the limit.
const GUIDELINES_BEFORE_SIZE = ["clear", "readable", "formats"] as const

const DOCUMENT_MAX_SIZE_MB =
  ORGANIZATION_DOCUMENTS_MAX_FILE_SIZE / (1024 * 1024)

/** "India • E-commerce • 128 members", from what the caller has translated. */
export const OrganizationMeta = ({
  countryName,
  industryName,
  members,
  className,
}: {
  countryName: string
  industryName: string
  members: string
  className?: string
}) => (
  <p
    className={cn(
      "flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground",
      className
    )}
  >
    <span>{countryName}</span>
    <span aria-hidden="true">•</span>
    <span>{industryName}</span>
    <span aria-hidden="true">•</span>
    <span>{members}</span>
  </p>
)

interface JoinOrganizationAsideProps {
  /** The picked organization; null until one is picked. */
  organization: OrganizationDirectoryEntry | null
  countryName: (countryCode: string) => string
  industryName: (industry: string) => string
  /** Takes the user back to the organization picker. */
  onChangeOrganization: () => void
  className?: string
}

/** The cards beside step 3 of the JOIN_ORGANIZATION path. */
export const JoinOrganizationAside = ({
  organization,
  countryName,
  industryName,
  onChangeOrganization,
  className,
}: JoinOrganizationAsideProps) => {
  const t = useTranslations("onboarding.joinOrganizationForm.aside")
  const tPicker = useTranslations("common.organizationPicker")

  return (
    <aside className={cn("flex flex-col gap-6", className)}>
      <Card className="rounded-sm shadow-sm">
        <CardHeader>
          <CardTitle>{t("next.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-col">
            {NEXT_STEPS.map((step, index) => (
              <li key={step} className="relative flex gap-3 pb-6 last:pb-0">
                {index < NEXT_STEPS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute start-4 top-9 bottom-1 border-s border-dashed"
                  />
                )}
                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
                >
                  {index + 1}
                </span>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">
                    {t(`next.steps.${step}.title`)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t(`next.steps.${step}.description`)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card className="rounded-sm shadow-sm">
        <CardHeader>
          <CardTitle>{t("guidelines.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2.5">
            {[
              ...GUIDELINES_BEFORE_SIZE.map((guideline) =>
                t(`guidelines.items.${guideline}`)
              ),
              t("guidelines.items.maxSize", { maxMb: DOCUMENT_MAX_SIZE_MB }),
              t("guidelines.items.encrypted"),
            ].map((guideline) => (
              <li
                key={guideline}
                className="flex items-start gap-2 text-xs text-muted-foreground"
              >
                <CircleCheck
                  className="mt-px size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                {guideline}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="rounded-sm shadow-sm">
        <CardHeader>
          <CardTitle>{t("selected.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {organization ? (
            <div className="flex items-start gap-3">
              <OrganizationAvatar organization={organization} />
              <div className="flex min-w-0 flex-col gap-1">
                <p className="truncate font-semibold" title={organization.name}>
                  {organization.name}
                </p>
                <OrganizationMeta
                  className="text-xs"
                  countryName={countryName(organization.countryCode)}
                  industryName={industryName(organization.industry)}
                  members={tPicker("members", {
                    count: organization.memberCount,
                  })}
                />
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto self-start p-0"
                  onClick={onChangeOrganization}
                >
                  {t("selected.change")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-2">
              <p className="text-sm text-muted-foreground">
                {t("selected.none")}
              </p>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0"
                onClick={onChangeOrganization}
              >
                {t("selected.choose")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </aside>
  )
}
