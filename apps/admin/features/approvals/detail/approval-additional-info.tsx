"use client"

import {
  AlarmClock,
  Building2,
  CalendarDays,
  Factory,
  Flag,
  Globe,
  Link as LinkIcon,
  MessageSquareText,
  UsersRound,
} from "lucide-react"
import { useFormatter, useLocale, useTranslations } from "next-intl"
import type { ReactNode } from "react"

import type { ApprovalDetail } from "@nexora/shared/types/approvals"

import { StatusBadge } from "@/components/common/badges/status-badge"
import { ToneBadge } from "@/components/common/badges/tone-badge"
import { DetailRow } from "@/components/common/page/detail-row"
import { PageSection } from "@/components/common/page/page-section"
import { organizationIndustryName } from "@/features/onboarding/join-organization/join-organization-form-config"
import { useRegionNames } from "@/hooks/use-region-names"

import { APPROVAL_PRIORITY_CONFIG } from "../approval-badges"

type Row = { key: string; icon: typeof Flag; label: string; value: ReactNode }

/** Facts about the request and its subject that help decide it. */
export const ApprovalAdditionalInfo = ({
  approval,
}: {
  approval: ApprovalDetail
}) => {
  const t = useTranslations("approvals")
  const tOnboarding = useTranslations("onboarding")
  const tPicker = useTranslations("common.organizationPicker")
  const format = useFormatter()
  const regionNames = useRegionNames(useLocale())
  const { request, organization } = approval

  const rows: Row[] = [
    {
      key: "priority",
      icon: Flag,
      label: t("columns.priority"),
      value: (
        <StatusBadge
          status={approval.priority}
          config={APPROVAL_PRIORITY_CONFIG}
          label={t(`priority.${approval.priority}`)}
        />
      ),
    },
    {
      key: "sla",
      icon: AlarmClock,
      label: t("detail.additional.sla"),
      value: (
        <ToneBadge tone={approval.overdue ? "danger" : "success"}>
          {approval.overdue
            ? t("stats.overdue")
            : t("detail.additional.onTime")}
        </ToneBadge>
      ),
    },
  ]

  if (request.type === "CREATE_ORG") {
    const r = request.organizationRequest
    if (r.proposedIndustry) {
      rows.push({
        key: "industry",
        icon: Factory,
        label: t("detail.additional.industry"),
        value: organizationIndustryName(tOnboarding, r.proposedIndustry),
      })
    }
    if (r.proposedSize) {
      rows.push({
        key: "size",
        icon: UsersRound,
        label: t("detail.additional.size"),
        value: tOnboarding("createOrganizationForm.sizeOption", {
          range: r.proposedSize.replace("-", "–"),
        }),
      })
    }
    if (r.proposedWebsite) {
      rows.push({
        key: "website",
        icon: LinkIcon,
        label: t("detail.additional.website"),
        value: (
          <a
            href={r.proposedWebsite}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-4 hover:underline"
          >
            {r.proposedWebsite}
          </a>
        ),
      })
    }
  }

  if (request.type === "JOIN_ORG") {
    if (organization) {
      rows.push(
        {
          key: "industry",
          icon: Factory,
          label: t("detail.additional.industry"),
          value: organizationIndustryName(tOnboarding, organization.industry),
        },
        {
          key: "members",
          icon: Building2,
          label: t("detail.additional.members"),
          value: tPicker("members", { count: organization.memberCount }),
        },
        {
          key: "country",
          icon: Globe,
          label: t("detail.additional.country"),
          value:
            regionNames.of(organization.countryCode) ??
            organization.countryCode,
        }
      )
    }
    const { joiningDate } = request.organizationRequest
    if (joiningDate) {
      rows.push({
        key: "joiningDate",
        icon: CalendarDays,
        label: t("detail.additional.joiningDate"),
        // A calendar date; the viewer's zone could move it a day.
        value: format.dateTime(new Date(joiningDate), {
          dateStyle: "medium",
          timeZone: "UTC",
        }),
      })
    }
  }

  return (
    <PageSection aria-label={t("detail.additional.title")}>
      <h2 className="font-semibold">{t("detail.additional.title")}</h2>
      <dl className="divide-y text-sm">
        {rows.map(({ key, icon, label, value }) => (
          <DetailRow key={key} icon={icon} label={label}>
            {value}
          </DetailRow>
        ))}
      </dl>
      {approval.reviewComment && (
        <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3 text-sm">
          <p className="flex items-center gap-2 font-medium">
            <MessageSquareText
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            {t("detail.additional.reviewComment")}
          </p>
          <p className="whitespace-pre-line text-muted-foreground">
            {approval.reviewComment}
          </p>
        </div>
      )}
    </PageSection>
  )
}
