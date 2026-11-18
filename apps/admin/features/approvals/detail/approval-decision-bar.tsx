"use client"

import { Check, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useId, useState, useTransition } from "react"

import {
  APPROVAL_COMMENT_MAX_LENGTH,
  type ApprovalDecision,
  type ApprovalRequestType,
} from "@nexora/schemas/onboarding/approvals"
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@nexora/ui/components/alert-dialog"
import { Banner } from "@nexora/ui/components/banner"
import { Button } from "@nexora/ui/components/button"
import { Label } from "@nexora/ui/components/label"
import { Spinner } from "@nexora/ui/components/spinner"
import { Textarea } from "@nexora/ui/components/textarea"

import { useApiToast } from "@/hooks/use-api-toast"
import { decideApproval } from "@/lib/api/approvals/decide-approval"

interface ApprovalDecisionBarProps {
  type: ApprovalRequestType
  id: string
}

/**
 * Approve or reject, each confirmed in a dialog. A rejection needs a reason
 * (the applicant sees it); an approval may carry a comment. On success the
 * page reloads its data and shows the outcome instead of this bar.
 */
export const ApprovalDecisionBar = ({ type, id }: ApprovalDecisionBarProps) => {
  const t = useTranslations("approvals")
  const tActions = useTranslations("common.actions")
  const router = useRouter()
  const showApiToast = useApiToast()
  const commentId = useId()
  const errorId = useId()

  const [decision, setDecision] = useState<ApprovalDecision | null>(null)
  const [comment, setComment] = useState("")
  const [showError, setShowError] = useState(false)
  const [pending, startTransition] = useTransition()

  const rejecting = decision === "REJECT"
  const missingReason = rejecting && !comment.trim()

  const open = (next: ApprovalDecision) => {
    setDecision(next)
    setComment("")
    setShowError(false)
  }

  const submit = () => {
    if (!decision) return
    if (missingReason) {
      setShowError(true)
      return
    }
    startTransition(async () => {
      const result = await decideApproval(
        { type, id },
        { decision, comment: comment.trim() || undefined }
      )
      showApiToast(result)
      // Decided (or decided first by someone else): show what it is now.
      if (result.success || result.code === "APPROVAL_ALREADY_DECIDED") {
        setDecision(null)
        router.refresh()
      }
    })
  }

  return (
    <>
      <div className="sticky bottom-0 z-10 -mx-4 -mb-4 border-t bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:-mb-6 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Banner variant="info" className="lg:max-w-xl">
            {t(`detail.decision.note.${type}`)}
          </Banner>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="destructive" onClick={() => open("REJECT")}>
              <X aria-hidden="true" />
              {t("detail.decision.reject")}
            </Button>
            <Button onClick={() => open("APPROVE")}>
              <Check aria-hidden="true" />
              {t("detail.decision.approve")}
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog
        open={decision !== null}
        onOpenChange={(next) => {
          if (!next && !pending) setDecision(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {rejecting
                ? t("detail.decision.rejectTitle")
                : t("detail.decision.approveTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {rejecting
                ? t("detail.decision.rejectDescription")
                : t(`detail.decision.approveDescription.${type}`)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor={commentId}>
              {rejecting
                ? t("detail.decision.reason")
                : t("detail.decision.comment")}
            </Label>
            <Textarea
              id={commentId}
              value={comment}
              maxLength={APPROVAL_COMMENT_MAX_LENGTH}
              rows={4}
              placeholder={
                rejecting
                  ? t("detail.decision.reasonPlaceholder")
                  : t("detail.decision.commentPlaceholder")
              }
              aria-invalid={showError && missingReason}
              aria-describedby={
                showError && missingReason ? errorId : undefined
              }
              onChange={(event) => setComment(event.target.value)}
            />
            {showError && missingReason && (
              <p id={errorId} className="text-sm text-destructive">
                {t("detail.decision.reasonRequired")}
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogClose disabled={pending}>
              {tActions("cancel")}
            </AlertDialogClose>
            <Button
              type="button"
              variant={rejecting ? "destructive" : "default"}
              disabled={pending}
              onClick={submit}
            >
              {pending && <Spinner aria-hidden="true" />}
              {rejecting
                ? t("detail.decision.confirmReject")
                : t("detail.decision.confirmApprove")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
