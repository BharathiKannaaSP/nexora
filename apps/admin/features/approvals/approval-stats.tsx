import { Clock } from "lucide-react"
import { useTranslations } from "next-intl"

import type { ApprovalRequestType } from "@nexora/schemas/onboarding/approvals"
import type { ApprovalSummary } from "@nexora/shared/types/approvals"

import { StatCard } from "@/components/common/stats/stat-card"
import { StatCardGrid } from "@/components/common/stats/stat-card-grid"

import { approvalsHref, type ApprovalFilters } from "./approval-search-params"
import { APPROVAL_TYPES, APPROVALS_TOTAL_ICON } from "./approval-types"

interface ApprovalStatsProps {
  summary: ApprovalSummary
  types: readonly ApprovalRequestType[]
  filters: ApprovalFilters
  basePath: string
}

export const ApprovalStats = ({
  summary,
  types,
  filters,
  basePath,
}: ApprovalStatsProps) => {
  const t = useTranslations("approvals")

  return (
    <StatCardGrid>
      <StatCard
        icon={APPROVALS_TOTAL_ICON}
        tone="brand"
        label={
          filters.status === "ALL"
            ? t("stats.totalAll")
            : t("stats.total", { status: t(`status.${filters.status}`) })
        }
        value={summary.total}
        caption={t("stats.requests")}
        href={approvalsHref(basePath, filters, { type: undefined, page: 1 })}
      />
      {types.map((type) => (
        <StatCard
          key={type}
          icon={APPROVAL_TYPES[type].icon}
          tone={APPROVAL_TYPES[type].tone}
          label={t(`types.${type}.tab`)}
          value={summary.byType[type]}
          caption={t("stats.requests")}
          href={approvalsHref(basePath, filters, { type, page: 1 })}
        />
      ))}
      <StatCard
        icon={Clock}
        tone="danger"
        label={t("stats.overdue")}
        value={summary.overdue}
        caption={t("stats.needsAttention")}
      />
    </StatCardGrid>
  )
}
