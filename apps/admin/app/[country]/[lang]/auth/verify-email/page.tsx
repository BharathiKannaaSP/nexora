import { MailCheck } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { redirect } from "next/navigation"
import { Suspense, type ReactNode } from "react"

import { AuthFormHeader, AuthFullPageLayout } from "@/components/auth"
import { authMetadata } from "@/features/auth/auth-page"
import { VerifyEmailContent } from "@/features/auth/verify-email/verify-email-content"
import { getCurrentUser } from "@/lib/api/auth/me"
import { localizedPath } from "@/lib/i18n/config"
import {
  resolveLocaleParams,
  type LocaleParams,
} from "@/lib/i18n/locale-params"

export interface VerifyEmailPageProps {
  params: Promise<LocaleParams>
  searchParams: Promise<{
    token?: string | string[]
    verified?: string | string[]
  }>
}

export const generateMetadata = ({ params }: VerifyEmailPageProps) =>
  authMetadata(params, "verifyEmail")

/**
 * Only verified users can sign in, so a session means there's nothing to
 * verify. A failed lookup (no or expired cookie) just renders the page. Must
 * sit inside <Suspense>: the lookup is an uncached fetch.
 */
const RedirectIfVerified = async ({
  dashboardHref,
  children,
}: {
  dashboardHref: string
  children: ReactNode
}) => {
  const user = await getCurrentUser()

  if (user.success && user.data.user.isEmailVerified) {
    redirect(dashboardHref)
  }

  return children
}

const VerifyEmailPage = async ({
  params,
  searchParams,
}: VerifyEmailPageProps) => {
  const { country, lang } = await resolveLocaleParams(params)

  const t = await getTranslations({
    locale: lang,
    namespace: "auth.verifyEmail",
  })

  return (
    <AuthFullPageLayout homeHref={localizedPath(country, lang)}>
      <AuthFormHeader
        alignment="center"
        leading={
          <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="size-9" aria-hidden="true" />
          </div>
        }
        title={t("metadata.title")}
        description={t("metadata.description")}
      />

      <div className="mt-8">
        <Suspense>
          <RedirectIfVerified dashboardHref={localizedPath(country, lang)}>
            <VerifyEmailContent
              lang={lang}
              signInHref={localizedPath(country, lang, "/auth/sign-in")}
              searchParams={searchParams}
            />
          </RedirectIfVerified>
        </Suspense>
      </div>
    </AuthFullPageLayout>
  )
}

export default VerifyEmailPage
