"use client"

import { useTranslations } from "next-intl"

import { useSearchParamState } from "@/hooks/use-search-param-state"

import { FilterSelect } from "../filters/filter-select"

interface PageSizeSelectProps {
  value: number
  options: readonly number[]
  defaultValue: number
  /** The query param, "pageSize" unless the page uses another. */
  param?: string
}

/** "10 / page", kept in the URL; changing it goes back to page 1. */
export const PageSizeSelect = ({
  value,
  options,
  defaultValue,
  param = "pageSize",
}: PageSizeSelectProps) => {
  const t = useTranslations("common")
  const { set } = useSearchParamState()

  return (
    <FilterSelect
      label={t("table.rowsPerPage")}
      className="sm:min-w-32 [&>span:first-child]:sr-only"
      value={String(value)}
      options={options.map((size) => ({
        value: String(size),
        label: t("table.perPage", { count: size }),
      }))}
      onValueChange={(next) =>
        set({ [param]: Number(next) === defaultValue ? null : next })
      }
    />
  )
}
