"use client"

import { FileX, ShieldCheck } from "lucide-react"
import { useTranslations } from "next-intl"

import type { ApprovalDetail } from "@nexora/shared/types/approvals"

import { FilterTabs } from "@/components/common/filters/filter-tabs"
import { EmptyState } from "@/components/common/page/empty-state"
import { PageSection } from "@/components/common/page/page-section"
import SubmittedInformation from "@/features/onboarding/review/submitted-information"
import { withSearchParams } from "@/lib/url/search-params"

import {
  APPROVAL_DETAIL_TABS,
  APPROVAL_TAB_PARAM,
  approvalDocumentCount,
  DEFAULT_APPROVAL_DETAIL_TAB,
  type ApprovalDetailTab,
} from "./approval-detail-config"

interface ApprovalDetailTabsProps {
  approval: ApprovalDetail
  tab: ApprovalDetailTab
  /** This request's page, without the tab. */
  basePath: string
}

/** What the applicant submitted, one part per tab; tabs are links (?tab=). */
export const ApprovalDetailTabs = ({
  approval,
  tab,
  basePath,
}: ApprovalDetailTabsProps) => {
  const t = useTranslations("approvals")
  const { request } = approval
  const documentCount = approvalDocumentCount(request)

  const tabHref = (value: ApprovalDetailTab) =>
    withSearchParams(
      basePath,
      { [APPROVAL_TAB_PARAM]: value },
      { [APPROVAL_TAB_PARAM]: DEFAULT_APPROVAL_DETAIL_TAB }
    )

  // Admin requests carry no files.
  const tabs = (
    Object.keys(APPROVAL_DETAIL_TABS) as ApprovalDetailTab[]
  ).filter((value) => value !== "documents" || request.type !== "ADMIN_ACCESS")

  const empty =
    tab === "documents" && documentCount === 0 ? (
      <EmptyState icon={FileX} title={t("detail.tabs.noDocuments")} />
    ) : tab === "access" && request.type === "CREATE_ORG" ? (
      // The creator asks for nothing: they get every permission.
      <EmptyState
        icon={ShieldCheck}
        title={t("detail.tabs.creatorAccessTitle")}
        description={t("detail.tabs.creatorAccess")}
      />
    ) : null

  return (
    <PageSection aria-label={t("detail.tabs.label")}>
      <FilterTabs
        label={t("detail.tabs.label")}
        value={tab}
        items={tabs.map((value) => ({
          value,
          label: t(`detail.tabs.${value}`),
          href: tabHref(value),
          count: value === "documents" ? documentCount : undefined,
        }))}
      />
      {empty ?? (
        <SubmittedInformation
          bare
          parts={APPROVAL_DETAIL_TABS[tab]}
          applicant={{
            name: approval.submittedBy.name ?? t("unknownUser"),
            email: approval.submittedBy.email,
            profile: approval.applicant,
          }}
          adminAccessRequest={
            request.type === "ADMIN_ACCESS" ? request.adminAccessRequest : null
          }
          organizationRequest={
            request.type === "CREATE_ORG" ? request.organizationRequest : null
          }
          joinRequest={
            request.type === "JOIN_ORG" ? request.organizationRequest : null
          }
          joinOrganization={approval.organization}
          documentCountryCode={(
            approval.applicant?.bioCountry ||
            approval.organization?.countryCode ||
            approval.countryCodes[0] ||
            ""
          ).toUpperCase()}
          fileUrls={approval.fileUrls}
        />
      )}
    </PageSection>
  )
}
