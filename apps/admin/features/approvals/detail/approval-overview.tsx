"use client"

import {
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarClock,
  Globe,
  IdCard,
  Mail,
  Network,
  UserRound,
  UserRoundCheck,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { JOIN_ORGANIZATION_DEPARTMENTS } from "@nexora/schemas/onboarding/join-organization"
import type { ApprovalDetail } from "@nexora/shared/types/approvals"

import { UserAvatar } from "@/components/common/cells/user-avatar"
import { DetailRow } from "@/components/common/page/detail-row"
import { PageSection } from "@/components/common/page/page-section"
import { DEPARTMENT_KEYS } from "@/features/onboarding/join-organization/join-organization-form-config"
import { useFormatDateTime } from "@/hooks/use-format-date-time"
import { useRegionNames } from "@/hooks/use-region-names"

/** Job title, department and employee id, where the request type has them. */
const useRoleFields = (approval: ApprovalDetail) => {
  const tOnboarding = useTranslations("onboarding")
  const { request } = approval

  if (request.type === "ADMIN_ACCESS") {
    const { jobTitle, department } = request.adminAccessRequest
    return { jobTitle, department, employeeId: null }
  }
  if (request.type === "JOIN_ORG") {
    const { jobTitle, department, employeeId } = request.organizationRequest
    const known = JOIN_ORGANIZATION_DEPARTMENTS.find((d) => d === department)
    return {
      jobTitle,
      department: known
        ? tOnboarding(
            `joinOrganizationForm.departments.${DEPARTMENT_KEYS[known]}`
          )
        : department,
      employeeId,
    }
  }
  return { jobTitle: null, department: null, employeeId: null }
}

export const ApprovalOverview = ({
  approval,
}: {
  approval: ApprovalDetail
}) => {
  const t = useTranslations("approvals")
  const formatDateTime = useFormatDateTime()
  const regionNames = useRegionNames(useLocale())
  const role = useRoleFields(approval)

  const name = approval.submittedBy.name ?? t("unknownUser")
  const subject = approval.subject ?? t("unknownSubject")
  const countries = approval.countryCodes
    .map((code) => regionNames.of(code) ?? code)
    .join(", ")

  return (
    <PageSection aria-label={t("detail.overview.title")}>
      <div className="space-y-1">
        <h2 className="font-semibold">{t("detail.overview.title")}</h2>
        <p className="text-sm text-muted-foreground">
          {t(`detail.overview.summary.${approval.type}`, {
            name,
            subject,
            countries: countries || "—",
          })}
        </p>
      </div>
      <dl className="divide-y text-sm">
         <DetailRow
          icon={UserRoundCheck}
          label={t("detail.overview.requestedBy")}
        >
          <span className="inline-flex items-center gap-2">
            <UserAvatar
              name={approval.submittedBy.name}
              src={approval.submittedBy.avatarUrl}
              className="size-7"
            />
            {name}
          </span>
        </DetailRow>
        <DetailRow icon={Mail} label={t("detail.overview.email")}>
          {approval.submittedBy.email ?? "—"}
        </DetailRow>
        <DetailRow
          icon={Building2}
          label={t(`detail.overview.subject.${approval.type}`)}
        >
          {subject}
        </DetailRow>
        {countries && (
          <DetailRow icon={Globe} label={t("detail.overview.countries")}>
            {countries}
          </DetailRow>
        )}
        {role.jobTitle && (
          <DetailRow icon={Briefcase} label={t("detail.overview.jobTitle")}>
            {role.jobTitle}
          </DetailRow>
        )}
        {role.department && (
          <DetailRow icon={Network} label={t("detail.overview.department")}>
            {role.department}
          </DetailRow>
        )}
        {role.employeeId && (
          <DetailRow icon={IdCard} label={t("detail.overview.employeeId")}>
            {role.employeeId}
          </DetailRow>
        )}
        <DetailRow
          icon={CalendarClock}
          label={t("detail.overview.requestedOn")}
        >
          <time dateTime={approval.submittedAt}>
            {formatDateTime(approval.submittedAt)}
          </time>
        </DetailRow>
        <DetailRow
          icon={UserRoundCheck}
          label={t("detail.overview.assignedTo")}
        >
          <span className="inline-flex items-center gap-2">
            <UserAvatar
              name={approval.assignedTo.name}
              src={approval.assignedTo.avatarUrl}
              className="size-7"
            />
            {t("detail.overview.you", {
              name: approval.assignedTo.name ?? t("unknownUser"),
            })}
          </span>
        </DetailRow>
        {approval.reviewedBy &&
          approval.reviewedBy.userId !== approval.assignedTo.userId && (
            <DetailRow
              icon={BadgeCheck}
              label={t("detail.overview.reviewedBy")}
            >
              {approval.reviewedBy.name ?? t("unknownUser")}
            </DetailRow>
          )}
      </dl>
    </PageSection>
  )
}
