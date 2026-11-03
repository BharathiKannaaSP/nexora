import { VerifyEmailPageProps } from "@/app/[country]/[lang]/auth/verify-email/page"
import { ResendVerification } from "./resend-verification"
import {
  Banner,
  BannerTitle,
  BannerDescription,
} from "@nexora/ui/components/banner"
import { Separator } from "@nexora/ui/components/separator"
import { ArrowLeft } from "lucide-react"
import { Locale } from "next-intl"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import VerifyEmailStatus from "./verify-email-status"

export const VerifyEmailContent = async ({
  lang,
  signInHref,
  searchParams,
}: {
  lang: Locale
  signInHref: string
  searchParams: VerifyEmailPageProps["searchParams"]
}) => {
  const { token, verified } = await searchParams

  if (typeof token === "string" && token) {
    return <VerifyEmailStatus token={token} />
  }

  // Set by VerifyEmailStatus after success, so a reload or a language
  // switch doesn't resend the used token.
  if (verified === "1") {
    return <VerifyEmailStatus token={null} />
  }

  const t = await getTranslations({
    locale: lang,
    namespace: "auth.verifyEmail",
  })

  return (
    <div className="flex flex-col gap-6">
      <Banner variant="info">
        <BannerTitle>{t("pending.title")}</BannerTitle>
        <BannerDescription>{t("pending.description")}</BannerDescription>
      </Banner>

      <ResendVerification />

      <Separator />

      <Link
        href={signInHref}
        className="mx-auto inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
        {t("backToSignIn")}
      </Link>
    </div>
  )
}
