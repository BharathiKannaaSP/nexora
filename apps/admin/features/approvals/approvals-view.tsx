"use client"

import { useTranslations } from "next-intl"

import {
  APPROVAL_FILTER_DEFAULTS,
  APPROVAL_PAGE_SIZES,
  type ApprovalRequestType,
} from "@nexora/schemas/onboarding/approvals"
import type { ListApprovalsResponseData } from "@nexora/shared/types/approvals"

import { DataTablePagination } from "@/components/common/data-table/data-table-pagination"
import { PageSizeSelect } from "@/components/common/data-table/page-size-select"
import { PageSection } from "@/components/common/page/page-section"

import { ApprovalFilters } from "./approval-filters"
import {
  approvalsHref,
  hasActiveApprovalFilters,
  type ApprovalFilters as Filters,
} from "./approval-search-params"
import { ApprovalStats } from "./approval-stats"
import { ApprovalTypeTabs } from "./approval-type-tabs"
import { ApprovalsTable } from "./approvals-table"

interface ApprovalsViewProps {
  data: ListApprovalsResponseData
  filters: Filters
  types: readonly ApprovalRequestType[]
  /** The localized /approvals path, e.g. /in/en/approvals. */
  basePath: string
}

export const ApprovalsView = ({
  data,
  filters,
  types,
  basePath,
}: ApprovalsViewProps) => {
  const t = useTranslations("approvals")
  const filtered = hasActiveApprovalFilters(filters)
  // The page the server actually returned, in case the asked one was past the end.
  const current = { ...filters, page: data.page }

  return (
    <>
      <ApprovalStats
        summary={data.summary}
        types={types}
        filters={filters}
        basePath={basePath}
      />
      <PageSection aria-label={t("listLabel")}>
        <ApprovalTypeTabs
          summary={data.summary}
          types={types}
          filters={filters}
          basePath={basePath}
        />
        <ApprovalFilters
          clearHref={
            filtered
              ? approvalsHref(basePath, {
                  ...APPROVAL_FILTER_DEFAULTS,
                  country: filters.country,
                  type: filters.type,
                  priority: undefined,
                  q: undefined,
                  pageSize: filters.pageSize,
                })
              : undefined
          }
        />
        <ApprovalsTable items={data.items} filtered={filtered} />
        <DataTablePagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          getPageHref={(page) => approvalsHref(basePath, current, { page })}
          pageSizeControl={
            <PageSizeSelect
              value={data.pageSize}
              options={APPROVAL_PAGE_SIZES}
              defaultValue={APPROVAL_FILTER_DEFAULTS.pageSize}
            />
          }
        />
      </PageSection>
    </>
  )
}
