"use client"

import { Eye } from "lucide-react"
import { useTranslations } from "next-intl"
import { useMemo } from "react"

import type { ApprovalListItem } from "@nexora/shared/types/approvals"

import { StatusBadge } from "@/components/common/badges/status-badge"
import { ToneBadge } from "@/components/common/badges/tone-badge"
import { DateTimeCell } from "@/components/common/cells/date-time-cell"
import { RowActions } from "@/components/common/cells/row-actions"
import { TitleCell } from "@/components/common/cells/title-cell"
import { UserCell } from "@/components/common/cells/user-cell"
import { createDataTableColumns } from "@/components/common/data-table/data-table"
import { useLocaleParams } from "@/hooks/use-locale-params"
import { href } from "@/lib/i18n/config"

import {
  APPROVAL_PRIORITY_CONFIG,
  APPROVAL_STATUS_CONFIG,
} from "./approval-badges"
import { APPROVAL_TYPES } from "./approval-types"

const column = createDataTableColumns<ApprovalListItem>()

export const APPROVAL_COLUMN_CLASSES = {
  actions: "w-20 text-end",
  submittedAt: "w-36",
}

export const useApprovalColumns = () => {
  const t = useTranslations("approvals")
  const { country, lang } = useLocaleParams()

  return useMemo(() => {
    const unknownUser = t("unknownUser")

    return column.columns([
      column.display({
        id: "request",
        header: t("columns.request"),
        cell: ({ row: { original: item } }) => (
          <TitleCell
            icon={APPROVAL_TYPES[item.type].icon}
            tone={APPROVAL_TYPES[item.type].tone}
            title={t(`types.${item.type}.title`)}
            subtitle={t(`types.${item.type}.subtitle`, {
              name: item.submittedBy.name ?? unknownUser,
              subject: item.subject ?? t("unknownSubject"),
            })}
          />
        ),
      }),
      column.display({
        id: "type",
        header: t("columns.type"),
        cell: ({ row: { original: item } }) => (
          <ToneBadge tone={APPROVAL_TYPES[item.type].tone}>
            {t(`types.${item.type}.badge`)}
          </ToneBadge>
        ),
      }),
      column.display({
        id: "submittedBy",
        header: t("columns.submittedBy"),
        cell: ({
          row: {
            original: { submittedBy },
          },
        }) => (
          <UserCell
            name={submittedBy.name}
            email={submittedBy.email}
            avatarUrl={submittedBy.avatarUrl}
            fallbackName={unknownUser}
          />
        ),
      }),
      column.display({
        id: "assignedTo",
        header: t("columns.assignedTo"),
        // The queue is only the caller's, so this is always them.
        cell: ({
          row: {
            original: { assignedTo },
          },
        }) => (
          <UserCell
            name={assignedTo.name}
            avatarUrl={assignedTo.avatarUrl}
            highlight={t("you")}
            fallbackName={unknownUser}
          />
        ),
      }),
      column.display({
        id: "priority",
        header: t("columns.priority"),
        cell: ({ row: { original: item } }) => (
          <StatusBadge
            status={item.priority}
            config={APPROVAL_PRIORITY_CONFIG}
            label={t(`priority.${item.priority}`)}
          />
        ),
      }),
      column.display({
        id: "submittedAt",
        header: t("columns.submittedOn"),
        cell: ({ row: { original: item } }) => (
          <DateTimeCell value={item.submittedAt} />
        ),
      }),
      column.display({
        id: "status",
        header: t("columns.status"),
        cell: ({ row: { original: item } }) => (
          <StatusBadge
            status={item.status}
            config={APPROVAL_STATUS_CONFIG}
            label={t(`status.${item.status}`)}
          />
        ),
      }),
      column.display({
        id: "actions",
        header: () => <span className="sr-only">{t("columns.actions")}</span>,
        cell: ({ row: { original: item } }) => (
          <RowActions
            actions={[
              {
                icon: Eye,
                label: t("actions.view"),
                href: href(
                  country,
                  lang,
                  APPROVAL_TYPES[item.type].detailPath(item.id)
                ),
              },
            ]}
          />
        ),
      }),
    ])
  }, [t, country, lang])
}
