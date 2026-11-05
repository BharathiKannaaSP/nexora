"use client"

import { useBootstrap } from "@/features/bootstrap/bootstrap-provider"
import { useHydrated } from "@/hooks/use-hydrated"
import type { AdminAccessRequest } from "@nexora/shared/types/onboarding"
import { Banner } from "@nexora/ui/components/banner"
import { Button } from "@nexora/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@nexora/ui/components/card"
import { cn } from "@nexora/ui/lib/utils"
import {
  Activity,
  Bell,
  CalendarDays,
  Check,
  CircleCheck,
  CircleX,
  ClipboardList,
  Clock,
  FileCheck,
  FileClock,
  FileText,
  FileX,
  Hash,
  type LucideIcon,
  UserRound,
  UserRoundCheck,
  X,
} from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"
import { useId, useState, type ReactNode } from "react"
import {
  PATH_KEYS,
  reviewOutcome,
  reviewStageState,
  reviewStages,
  type ReviewOutcome,
  type ReviewStageState,
} from "./review-status"
import SubmittedInformation from "./submitted-information"

const OUTCOME_ICONS: Record<
  ReviewOutcome,
  { file: LucideIcon; title: LucideIcon }
> = {
  waiting: { file: FileClock, title: CircleCheck },
  inReview: { file: FileClock, title: CircleCheck },
  approved: { file: FileCheck, title: CircleCheck },
  rejected: { file: FileX, title: CircleX },
}

// waiting and inReview share the "submitted" hero; only the badge differs.
const HERO_KEYS = {
  waiting: "submitted",
  inReview: "submitted",
  approved: "approved",
  rejected: "rejected",
} as const satisfies Record<ReviewOutcome, string>

const STATUS_BADGE_CLASSES: Record<ReviewOutcome, string> = {
  waiting: "bg-warning/10 text-warning",
  inReview: "bg-info/10 text-info",
  approved: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
}

const STAGE_ICONS = {
  submitted: Check,
  inReview: Clock,
  underApproval: UserRound,
  completed: Check,
} as const satisfies Record<(typeof reviewStages)[number], LucideIcon>

const STAGE_INDICATOR_CLASSES: Record<ReviewStageState, string> = {
  done: "bg-primary text-primary-foreground",
  current: "bg-primary/10 text-primary ring-2 ring-primary/30",
  pending: "bg-muted text-muted-foreground",
  rejected: "bg-destructive/10 text-destructive ring-2 ring-destructive/30",
}

const STAGE_CAPTION_CLASSES: Record<ReviewStageState, string> = {
  done: "text-primary",
  current: "text-primary",
  pending: "text-muted-foreground",
  rejected: "text-destructive",
}

const DetailRow = ({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon
  label: string
  children: ReactNode
}) => (
  <div className="flex items-center justify-between gap-4 py-2.5">
    <dt className="flex items-center gap-3 text-muted-foreground">
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {label}
    </dt>
    <dd className="min-w-0 truncate text-end font-medium">{children}</dd>
  </div>
)

const NextStep = ({
  icon: Icon,
  iconClassName,
  title,
  description,
}: {
  icon: LucideIcon
  iconClassName: string
  title: string
  description: string
}) => (
  <li className="flex gap-4">
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full",
        iconClassName
      )}
    >
      <Icon className="size-5" aria-hidden="true" />
    </span>
    <div className="flex flex-col gap-1">
      <p className="font-medium">{title}</p>
      <p className="text-muted-foreground">{description}</p>
    </div>
  </li>
)

interface OnboardingReviewProps {
  /** The BECOME_ADMIN path's request; left out on the other paths. */
  adminAccessRequest?: AdminAccessRequest | null
}

const OnboardingReview = ({
  adminAccessRequest = null,
}: OnboardingReviewProps) => {
  const t = useTranslations("onboarding")
  const format = useFormatter()
  const { account, onboarding } = useBootstrap()
  const [showSubmitted, setShowSubmitted] = useState(false)
  const submittedId = useId()
  const hydrated = useHydrated()

  const request = adminAccessRequest

  const outcome = reviewOutcome(onboarding, request?.status ?? null)
  const heroKey = HERO_KEYS[outcome]
  const { file: FileIcon, title: TitleIcon } = OUTCOME_ICONS[outcome]

  const submittedAt = request?.submittedAt ?? onboarding?.submittedAt ?? null
  // Formatted on the client only: Node's ICU data can disagree with the
  // browser's (e.g. "PM" vs "오후"), which breaks hydration.
  const formatDateTime = (value: string) =>
    hydrated
      ? format.dateTime(new Date(value), {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : ""

  const rejectionReason =
    request?.reviewComment ?? onboarding?.rejectionReason ?? null

  const isRejected = outcome === "rejected"

  return (
    <div className="flex flex-col gap-6">
      {/* Status */}
      <Card className="gap-8 py-8">
        <CardContent className="flex flex-col items-center gap-8 px-4 text-center sm:px-8">
          <div className="flex flex-col items-center gap-5">
            <span
              className={cn(
                "flex size-24 items-center justify-center rounded-full",
                isRejected
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary"
              )}
            >
              <FileIcon className="size-11" aria-hidden="true" />
            </span>
            <div className="flex flex-col items-center gap-2">
              <h1 className="flex items-center gap-2 text-2xl font-semibold">
                <TitleIcon
                  className={cn(
                    "size-7 shrink-0",
                    isRejected ? "text-destructive" : "text-success"
                  )}
                  aria-hidden="true"
                />
                {t(`review.hero.${heroKey}.title`)}
              </h1>
              <p
                className={cn(
                  "text-xl font-semibold",
                  isRejected ? "text-destructive" : "text-primary"
                )}
              >
                {t(`review.hero.${heroKey}.subtitle`)}
              </p>
            </div>
            <p className="max-w-lg text-muted-foreground">
              {t(`review.hero.${heroKey}.description`)}
            </p>
          </div>

          {/* Progress */}
          <ol className="grid w-full grid-cols-2 gap-y-6 sm:grid-cols-4">
            {reviewStages.map((stage, index) => {
              const state = reviewStageState(outcome, index)
              const Icon = state === "rejected" ? X : STAGE_ICONS[stage]
              const caption =
                stage === "submitted" && submittedAt
                  ? formatDateTime(submittedAt)
                  : t(`review.stageStates.${state}`)

              return (
                <li
                  key={stage}
                  className="relative flex flex-col items-center gap-2"
                  aria-current={
                    state === "current" || state === "rejected"
                      ? "step"
                      : undefined
                  }
                >
                  {index < reviewStages.length - 1 && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute top-5 left-[calc(50%+1.75rem)] hidden h-px w-[calc(100%-3.5rem)] border-t border-dashed sm:block rtl:right-[calc(50%+1.75rem)] rtl:left-auto",
                        state === "done" ? "border-primary" : "border-border"
                      )}
                    />
                  )}
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-full",
                      STAGE_INDICATOR_CLASSES[state]
                    )}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="font-medium">
                    {t(`review.stages.${stage}`)}
                  </span>
                  <span className={cn("text-xs", STAGE_CAPTION_CLASSES[state])}>
                    {caption}
                  </span>
                </li>
              )
            })}
          </ol>

          {isRejected ? (
            rejectionReason && (
              <Banner variant="destructive" className="text-start">
                <p className="font-medium">{t("review.rejectionReason")}</p>
                <p className="text-foreground/80">{rejectionReason}</p>
              </Banner>
            )
          ) : (
            <Banner variant="info" className="justify-center">
              {t("review.turnaround")}
            </Banner>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Request details */}
        <Card>
          <CardHeader>
            <CardTitle className="font-semibold">
              {t("review.details.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <dl className="divide-y">
              <DetailRow icon={Hash} label={t("review.details.requestId")}>
                <span
                  className="font-mono text-xs"
                  title={request?.id ?? onboarding?.id}
                >
                  {request?.id ?? onboarding?.id ?? "—"}
                </span>
              </DetailRow>
              <DetailRow
                icon={CalendarDays}
                label={t("review.details.submittedOn")}
              >
                {submittedAt ? formatDateTime(submittedAt) : "—"}
              </DetailRow>
              <DetailRow
                icon={ClipboardList}
                label={t("review.details.requestType")}
              >
                {onboarding?.selectedPath
                  ? t(
                      `chooseYourPathForm.paths.${PATH_KEYS[onboarding.selectedPath]}.label`
                    )
                  : "—"}
              </DetailRow>
              <DetailRow
                icon={UserRound}
                label={t("review.details.submittedBy")}
              >
                {t("review.details.you", {
                  name: `${account.firstName} ${account.lastName}`,
                })}
              </DetailRow>
              <DetailRow
                icon={Activity}
                label={t("review.details.currentStatus")}
              >
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium",
                    STATUS_BADGE_CLASSES[outcome]
                  )}
                >
                  {t(`review.statuses.${outcome}`)}
                </span>
              </DetailRow>
            </dl>
            <Button
              variant="outline"
              className="self-center"
              aria-expanded={showSubmitted}
              size="sm"
              aria-controls={submittedId}
              onClick={() => setShowSubmitted((shown) => !shown)}
            >
              <FileText aria-hidden="true" />
              {showSubmitted
                ? t("review.hideSubmitted")
                : t("review.viewSubmitted")}
            </Button>
          </CardContent>
        </Card>

        {/* What happens next */}
        <Card>
          <CardHeader>
            <CardTitle className="font-semibold">
              {t("review.next.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-6">
              <NextStep
                icon={Clock}
                iconClassName="bg-primary/10 text-primary"
                title={t("review.next.review.title")}
                description={t("review.next.review.description")}
              />
              <NextStep
                icon={Bell}
                iconClassName="bg-warning/10 text-warning"
                title={t("review.next.notified.title")}
                description={t("review.next.notified.description")}
              />
              <NextStep
                icon={UserRoundCheck}
                iconClassName="bg-success/10 text-success"
                title={t("review.next.activation.title")}
                description={t("review.next.activation.description")}
              />
            </ul>
          </CardContent>
        </Card>
      </div>

      <div id={submittedId} hidden={!showSubmitted}>
        {showSubmitted && (
          <SubmittedInformation adminAccessRequest={adminAccessRequest} />
        )}
      </div>

      <p className="text-center text-muted-foreground">{t("review.thanks")}</p>
    </div>
  )
}

export default OnboardingReview
