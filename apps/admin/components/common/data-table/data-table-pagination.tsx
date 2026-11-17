import { useTranslations } from "next-intl"
import type { ReactNode } from "react"

import { pageCount, pageRange } from "@/lib/pagination"

import { Pager } from "./pager"

interface DataTablePaginationProps {
  page: number
  pageSize: number
  total: number
  getPageHref: (page: number) => string
  /** Usually a PageSizeSelect. */
  pageSizeControl?: ReactNode
}

export const DataTablePagination = ({
  page,
  pageSize,
  total,
  getPageHref,
  pageSizeControl,
}: DataTablePaginationProps) => {
  const t = useTranslations("common")
  const { from, to } = pageRange(page, pageSize, total)

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {t("table.showing", { from, to, total })}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Pager
          page={page}
          pageCount={pageCount(total, pageSize)}
          getPageHref={getPageHref}
        />
        {pageSizeControl}
      </div>
    </div>
  )
}
