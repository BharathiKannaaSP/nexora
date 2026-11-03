"use client"

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@nexora/ui/components/alert-dialog"
import { Button } from "@nexora/ui/components/button"
import { RefreshCw } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect } from "react"
import { getApiErrorCode } from "@/lib/api/render-error"

type CodeKey = Parameters<ReturnType<typeof useTranslations<"codes">>>[0]

/**
 * Catches errors thrown while rendering any page, e.g. a gateway failure in
 * a Server Component, and shows the backend code (UNKNOWN_ERROR otherwise)
 * in a dialog until the user retries.
 */
const ErrorBoundary = ({
  error,
  retry,
}: {
  error: unknown
  retry: () => void
}) => {
  const t = useTranslations("common.error")
  const tCodes = useTranslations("codes")
  const code = (getApiErrorCode(error) ?? "UNKNOWN_ERROR") as CodeKey

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    // Stays open: there's nothing to show behind it until the page renders.
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {tCodes(tCodes.has(code) ? code : "UNKNOWN_ERROR")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button onClick={() => retry()}>
            <RefreshCw aria-hidden="true" />
            {t("retry")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ErrorBoundary
