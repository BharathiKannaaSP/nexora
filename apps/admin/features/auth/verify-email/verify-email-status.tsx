"use client"

import {
  Banner,
  BannerDescription,
  BannerTitle,
} from "@nexora/ui/components/banner"
import { buttonVariants } from "@nexora/ui/components/button"
import { LoaderCircle } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { verifyEmail } from "@/lib/api/auth/verify-email"
import { href } from "@/lib/i18n/config"
import { clearPendingVerification } from "./pending-verification"

type CodeKey = Parameters<ReturnType<typeof useTranslations<"codes">>>[0]

type Status =
  | { state: "verifying" }
  | { state: "success" }
  | { state: "error"; code: string }

/**
 * Verifies the token from the browser rather than during server rendering:
 * email security scanners often open links before the user does, and the
 * token can only be used once.
 */
const VerifyEmailStatus = ({
  token,
}: {
  /** `null` once verified: the page was opened with `?verified=1`. */
  token: string | null
}) => {
  const t = useTranslations("auth.verifyEmail")
  const tCodes = useTranslations("codes")
  const { country, lang } = useParams<{ country: string; lang: string }>()
  const [status, setStatus] = useState<Status>(
    token ? { state: "verifying" } : { state: "success" }
  )
  // Strict Mode runs effects twice in development; a second request would
  // fail because the first one already used the token.
  const requested = useRef(false)

  useEffect(() => {
    if (!token || requested.current) return
    requested.current = true

    const verify = async () => {
      const response = await verifyEmail(token)
      if (response.success) {
        // The token is now used up. Swap it out of the URL so a reload or a
        // language switch shows the success state instead of failing.
        window.history.replaceState(null, "", "?verified=1")
        clearPendingVerification()
        setStatus({ state: "success" })
        return
      }

      setStatus({ state: "error", code: response.code })
    }

    verify()
  }, [token])

  if (status.state === "verifying") {
    return (
      <div
        role="status"
        className="flex items-center gap-3 text-sm text-muted-foreground"
      >
        <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
        <div>
          <p className="font-medium text-foreground">{t("verifying.title")}</p>
          <p>{t("verifying.description")}</p>
        </div>
      </div>
    )
  }

  const signInLink = (
    <Link
      href={href(country, lang, "/auth/sign-in")}
      className={buttonVariants({
        fullWidth: true,
        className: "rounded-none p-5 text-xs",
      })}
    >
      {t("signIn")}
    </Link>
  )

  if (status.state === "success") {
    return (
      <div className="flex flex-col gap-6">
        <Banner variant="success">
          <BannerTitle>{t("success.title")}</BannerTitle>
          <BannerDescription>{t("success.description")}</BannerDescription>
        </Banner>
        {signInLink}
      </div>
    )
  }

  const code = status.code as CodeKey

  return (
    <div className="flex flex-col gap-6">
      <Banner variant="destructive">
        <BannerTitle>{t("error.title")}</BannerTitle>
        <BannerDescription>
          {tCodes(tCodes.has(code) ? code : "UNKNOWN_ERROR")}
        </BannerDescription>
      </Banner>
      <p className="text-sm text-muted-foreground">{t("error.description")}</p>
      <div className="flex flex-col gap-3">
        {signInLink}
        <Link
          href={href(country, lang, "/auth/sign-up")}
          className={buttonVariants({
            variant: "outline",
            fullWidth: true,
            className: "rounded-none p-5 text-xs",
          })}
        >
          {t("signUp")}
        </Link>
      </div>
    </div>
  )
}

export default VerifyEmailStatus
