"use client"

import { Button } from "@nexora/ui/components/button"
import { LoaderCircle, RefreshCw } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { resendVerification } from "@/lib/api/auth/resend-verification"
import { useApiToast } from "@/hooks/use-api-toast"
import { VERIFICATION_RESEND_COOLDOWN_MS } from "@nexora/shared/constants/auth"
import {
  readPendingVerification,
  writePendingVerification,
  type PendingVerification,
} from "./pending-verification"

export const ResendVerification = () => {
  const t = useTranslations("auth.verifyEmail.resend")
  const showApiToast = useApiToast()
  const [pending, setPending] = useState<PendingVerification | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [sending, setSending] = useState(false)

  // sessionStorage only exists in the browser, so read it after hydration.
  useEffect(() => {
    setPending(readPendingVerification())
  }, [])

  const secondsLeft = pending
    ? Math.max(0, Math.ceil((pending.resendAvailableAt - now) / 1000))
    : 0

  useEffect(() => {
    if (secondsLeft === 0) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [secondsLeft])

  // Without the identifier (e.g. opened in a new tab) there's no one to
  // resend to; the user can sign in again to restart the flow.
  if (!pending) return null

  const handleResend = async () => {
    setSending(true)
    const result = await resendVerification(pending.identifier)
    setSending(false)
    showApiToast(result)

    if (result.success) {
      const next = {
        ...pending,
        resendAvailableAt: Date.now() + VERIFICATION_RESEND_COOLDOWN_MS,
      }
      writePendingVerification(next)
      setPending(next)
      setNow(Date.now())
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {t("prompt")}
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        fullWidth
        className="h-12 text-sm normal-case"
        disabled={secondsLeft > 0 || sending}
        onClick={handleResend}
      >
        {sending ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : (
          <RefreshCw aria-hidden="true" />
        )}
        {t("action")}
      </Button>

      {secondsLeft > 0 && (
        <p
          className="text-center text-sm text-muted-foreground"
          aria-live="polite"
        >
          {t.rich("cooldown", {
            seconds: secondsLeft,
            highlight: (chunks) => (
              <span className="font-medium text-primary">{chunks}</span>
            ),
          })}
        </p>
      )}
    </div>
  )
}
