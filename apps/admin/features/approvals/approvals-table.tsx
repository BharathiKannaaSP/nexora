"use client"

import { Inbox } from "lucide-react"
import { useTranslations } from "next-intl"

import type { ApprovalListItem } from "@nexora/shared/types/approvals"

import { DataTable } from "@/components/common/data-table/data-table"
import { EmptyState } from "@/components/common/page/empty-state"

import { APPROVAL_COLUMN_CLASSES, useApprovalColumns } from "./approval-columns"

interface ApprovalsTableProps {
  items: ApprovalListItem[]
  /** Something is filtered, so "no results" rather than "all caught up". */
  filtered: boolean
}

export const ApprovalsTable = ({ items, filtered }: ApprovalsTableProps) => {
  const t = useTranslations("approvals")
  const columns = useApprovalColumns()

  return (
    <DataTable
      columns={columns}
      data={items}
      getRowId={(item) => `${item.type}:${item.id}`}
      columnClassNames={APPROVAL_COLUMN_CLASSES}
      emptyState={
        <EmptyState
          icon={Inbox}
          title={filtered ? t("empty.filteredTitle") : t("empty.title")}
          description={
            filtered ? t("empty.filteredDescription") : t("empty.description")
          }
        />
      }
    />
  )
}
