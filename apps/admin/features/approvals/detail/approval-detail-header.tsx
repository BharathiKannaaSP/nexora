"use client"

import {
  ArrowLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  Clock,
} from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"

import { isOpenApprovalStatus } from "@nexora/schemas/onboarding/approvals"
import type { ApprovalDetail } from "@nexora/shared/types/approvals"
import { buttonVariants } from "@nexora/ui/components/button"
import { cn } from "@nexora/ui/lib/utils"

import { StatusBadge } from "@/components/common/badges/status-badge"
import { IconTile } from "@/components/common/stats/icon-tile"
import { useFormatDateTime } from "@/hooks/use-format-date-time"

import { APPROVAL_STATUS_CONFIG } from "../approval-badges"
import { APPROVAL_TYPES } from "../approval-types"

interface ApprovalDetailHeaderProps {
  approval: ApprovalDetail
  /** The localized list, and the list on this type's tab. */
  listHref: string
  typeListHref: string
}

/** Who has it now: the reviewer while open, otherwise who decided it. */
const ActionCard = ({ approval }: { approval: ApprovalDetail }) => {
  const t = useTranslations("approvals")
  const formatDateTime = useFormatDateTime()

  const open = isOpenApprovalStatus(approval.status)
  const decided =
    approval.status === "APPROVED" || approval.status === "REJECTED"
  const Icon = open
    ? Clock
    : approval.status === "APPROVED"
      ? CircleCheck
      : CircleX
  const tone = open
    ? "brand"
    : approval.status === "APPROVED"
      ? "success"
      : "danger"

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
      <IconTile icon={Icon} tone={tone} size="sm" />
      <div className="min-w-0">
        <p className="text-sm font-medium">
          {open ? t("detail.action.pending") : t(`status.${approval.status}`)}
        </p>
        <p className="text-xs text-muted-foreground">
          {open
            ? t("detail.action.assigned", {
                date: formatDateTime(approval.assignedAt),
              })
            : decided && approval.reviewedAt
              ? t("detail.action.decided", {
                  name: approval.reviewedBy?.name ?? t("unknownUser"),
                  date: formatDateTime(approval.reviewedAt),
                })
              : null}
        </p>
      </div>
    </div>
  )
}

export const ApprovalDetailHeader = ({
  approval,
  listHref,
  typeListHref,
}: ApprovalDetailHeaderProps) => {
  const t = useTranslations("approvals")
  const config = APPROVAL_TYPES[approval.type]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col items-start gap-3">
          <nav aria-label={t("detail.breadcrumb.label")}>
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <li>
                <Link href={listHref} className="hover:text-foreground">
                  {t("metadata.title")}
                </Link>
              </li>
              <ChevronRight
                className="size-4 rtl:rotate-180"
                aria-hidden="true"
              />
              <li>
                <Link href={typeListHref} className="hover:text-foreground">
                  {t(`types.${approval.type}.tab`)}
                </Link>
              </li>
              <ChevronRight
                className="size-4 rtl:rotate-180"
                aria-hidden="true"
              />
              <li aria-current="page" className="text-foreground">
                {t("detail.breadcrumb.details")}
              </li>
            </ol>
          </nav>
          <Link
            href={typeListHref}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <ArrowLeft className="rtl:rotate-180" aria-hidden="true" />
            {t("detail.back", { list: t(`types.${approval.type}.tab`) })}
          </Link>
        </div>
        <ActionCard approval={approval} />
      </div>

      <div className="flex items-center gap-4 rounded-xl border bg-card p-4 sm:p-5">
        <IconTile icon={config.icon} tone={config.tone} />
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {t(`types.${approval.type}.title`)}
            </h1>
            <StatusBadge
              status={approval.status}
              config={APPROVAL_STATUS_CONFIG}
              label={t(`status.${approval.status}`)}
            />
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {t("detail.requestId", { id: approval.id })}
          </p>
        </div>
      </div>
    </div>
  )
}
