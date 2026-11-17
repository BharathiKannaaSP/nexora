import { useTranslations } from "next-intl"

import type { ApprovalRequestType } from "@nexora/schemas/onboarding/approvals"
import type { ApprovalSummary } from "@nexora/shared/types/approvals"

import {
  FilterTabs,
  type FilterTabItem,
} from "@/components/common/filters/filter-tabs"

import { approvalsHref, type ApprovalFilters } from "./approval-search-params"

const ALL = "ALL"
type TabValue = ApprovalRequestType | typeof ALL

interface ApprovalTypeTabsProps {
  summary: ApprovalSummary
  types: readonly ApprovalRequestType[]
  filters: ApprovalFilters
  basePath: string
}

export const ApprovalTypeTabs = ({
  summary,
  types,
  filters,
  basePath,
}: ApprovalTypeTabsProps) => {
  const t = useTranslations("approvals")

  const items: FilterTabItem<TabValue>[] = [
    {
      value: ALL,
      label: t("tabs.all"),
      count: summary.total,
      href: approvalsHref(basePath, filters, { type: undefined, page: 1 }),
    },
    ...types.map((type) => ({
      value: type,
      label: t(`types.${type}.tab`),
      count: summary.byType[type],
      href: approvalsHref(basePath, filters, { type, page: 1 }),
    })),
  ]

  return (
    <FilterTabs
      label={t("tabs.label")}
      items={items}
      value={filters.type ?? ALL}
    />
  )
}
