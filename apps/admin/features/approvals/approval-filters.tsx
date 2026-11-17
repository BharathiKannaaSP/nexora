"use client"

import { useTranslations } from "next-intl"

import {
  APPROVAL_FILTER_DEFAULTS,
  APPROVAL_PRIORITIES,
  APPROVAL_SEARCH_MAX_LENGTH,
  APPROVAL_STATUS_FILTERS,
} from "@nexora/schemas/onboarding/approvals"

import { FilterBar } from "@/components/common/filters/filter-bar"
import { UrlFilterSelect } from "@/components/common/filters/url-filter-select"
import { UrlSearchInput } from "@/components/common/filters/url-search-input"

import { APPROVAL_PARAMS } from "./approval-search-params"

const ANY = "ANY"

interface ApprovalFiltersProps {
  /** Where "Clear filters" goes; hidden when nothing is filtered. */
  clearHref?: string
}

export const ApprovalFilters = ({ clearHref }: ApprovalFiltersProps) => {
  const t = useTranslations("approvals")
  const tCommon = useTranslations("common")

  return (
    <FilterBar clearHref={clearHref} clearLabel={tCommon("table.clearFilters")}>
      <UrlSearchInput
        param={APPROVAL_PARAMS.q}
        label={t("filters.searchLabel")}
        placeholder={t("filters.search")}
        maxLength={APPROVAL_SEARCH_MAX_LENGTH}
      />
      <UrlFilterSelect
        param={APPROVAL_PARAMS.status}
        label={t("filters.status")}
        defaultValue={APPROVAL_FILTER_DEFAULTS.status}
        options={APPROVAL_STATUS_FILTERS.map((status) => ({
          value: status,
          label: t(`status.${status}`),
        }))}
      />
      <UrlFilterSelect
        param={APPROVAL_PARAMS.priority}
        label={t("filters.priority")}
        defaultValue={ANY}
        options={[
          { value: ANY, label: t("filters.all") },
          ...APPROVAL_PRIORITIES.map((priority) => ({
            value: priority,
            label: t(`priority.${priority}`),
          })),
        ]}
      />
    </FilterBar>
  )
}
