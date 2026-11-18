"use client"

import { Check, X } from "lucide-react"
import { useTranslations } from "next-intl"

import type { ApprovalDetail } from "@nexora/shared/types/approvals"
import { cn } from "@nexora/ui/lib/utils"

import { ToneBadge } from "@/components/common/badges/tone-badge"
import { PageSection } from "@/components/common/page/page-section"
import { useFormatDateTime } from "@/hooks/use-format-date-time"

const STAGES = ["submitted", "review", "decision", "completed"] as const
type Stage = (typeof STAGES)[number]
type StageState = "done" | "current" | "pending" | "rejected"

/**
 * Where each stage stands. Assignment happens on submit, so an open request
 * is always under review; a decision finishes it (approved) or stops it at
 * the decision (rejected). Withdrawn stops it under review.
 */
const stageStates = (
  status: ApprovalDetail["status"]
): Record<Stage, StageState> => {
  switch (status) {
    case "APPROVED":
      return {
        submitted: "done",
        review: "done",
        decision: "done",
        completed: "done",
      }
    case "REJECTED":
      return {
        submitted: "done",
        review: "done",
        decision: "rejected",
        completed: "pending",
      }
    case "WITHDRAWN":
      return {
        submitted: "done",
        review: "rejected",
        decision: "pending",
        completed: "pending",
      }
    default:
      return {
        submitted: "done",
        review: "current",
        decision: "pending",
        completed: "pending",
      }
  }
}

const INDICATOR_CLASSES: Record<StageState, string> = {
  done: "bg-primary text-primary-foreground",
  current: "bg-primary text-primary-foreground ring-4 ring-primary/15",
  pending: "bg-muted text-muted-foreground",
  rejected: "bg-destructive text-white",
}

export const ApprovalProgress = ({
  approval,
}: {
  approval: ApprovalDetail
}) => {
  const t = useTranslations("approvals")
  const formatDateTime = useFormatDateTime()
  const states = stageStates(approval.status)

  const captions: Record<Stage, string | null> = {
    submitted: formatDateTime(approval.submittedAt),
    review: t("detail.progress.assigned", {
      name: approval.assignedTo.name ?? t("unknownUser"),
      date: formatDateTime(approval.assignedAt),
    }),
    decision: approval.reviewedAt ? formatDateTime(approval.reviewedAt) : null,
    completed:
      approval.status === "APPROVED" && approval.reviewedAt
        ? formatDateTime(approval.reviewedAt)
        : null,
  }

  return (
    <PageSection aria-label={t("detail.progress.title")}>
      <h2 className="font-semibold">{t("detail.progress.title")}</h2>
      <ol className="flex flex-col">
        {STAGES.map((stage, index) => {
          const state = states[stage]
          const last = index === STAGES.length - 1
          return (
            <li
              key={stage}
              className="relative flex gap-3 pb-6 last:pb-0"
              aria-current={state === "current" ? "step" : undefined}
            >
              {!last && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-s-3.5 top-8 bottom-1 w-px",
                    state === "done" ? "bg-primary" : "bg-border"
                  )}
                />
              )}
              <span
                className={cn(
                  "z-10 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  INDICATOR_CLASSES[state]
                )}
              >
                {state === "done" ? (
                  <Check className="size-3.5" aria-hidden="true" />
                ) : state === "rejected" ? (
                  <X className="size-3.5" aria-hidden="true" />
                ) : (
                  index + 1
                )}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    {t(`detail.progress.stages.${stage}`)}
                  </p>
                  {state !== "pending" && (
                    <ToneBadge
                      tone={
                        state === "done"
                          ? "success"
                          : state === "current"
                            ? "brand"
                            : "danger"
                      }
                    >
                      {t(`detail.progress.states.${state}`)}
                    </ToneBadge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {state === "pending"
                    ? t("detail.progress.states.pending")
                    : captions[stage]}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
    </PageSection>
  )
}
