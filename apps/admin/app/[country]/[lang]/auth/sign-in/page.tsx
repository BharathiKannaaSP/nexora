import { getTranslations } from "next-intl/server"
import Link from "next/link"

import { AuthFormHeader, AuthFormPanel, AuthLayout } from "@/components/auth"
import { authMetadata, AuthPageBrandPanel } from "@/features/auth/auth-page"
import { RegisteredBanner } from "@/features/auth/sign-in/registered-banner"
import { SignInFormContainer } from "@/features/auth/sign-in/sign-in-form-container"
import { localizedPath } from "@/lib/i18n/config"
import {
  resolveLocaleParams,
  type LocaleParams,
} from "@/lib/i18n/locale-params"

interface SignInPageProps {
  params: Promise<LocaleParams>
}

export const generateMetadata = ({ params }: SignInPageProps) =>
  authMetadata(params, "signIn")

const SignInPage = async ({ params }: SignInPageProps) => {
  const { country, lang } = await resolveLocaleParams(params)

  const t = await getTranslations({ locale: lang, namespace: "auth.signIn" })

  const href = (path?: string) => localizedPath(country, lang, path)

  return (
    <AuthLayout
      brandPanel={<AuthPageBrandPanel lang={lang} homeHref={href()} />}
    >
      <AuthFormPanel
        action={
          <div className="flex w-full items-center justify-end gap-4">
            <p className="text-sm">
              {t("noAccount")}{" "}
              <Link
                href={href("/auth/sign-up")}
                className="font-medium text-foreground underline underline-offset-4"
              >
                {t("signUp")}
              </Link>
            </p>
          </div>
        }
      >
        <AuthFormHeader
          title={t("form.title")}
          description={t("form.description")}
        />
        <RegisteredBanner />
        <div className="mt-8">
          <SignInFormContainer />
        </div>
      </AuthFormPanel>
    </AuthLayout>
  )
}

export default SignInPage
