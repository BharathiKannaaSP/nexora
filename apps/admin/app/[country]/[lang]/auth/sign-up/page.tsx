import { getTranslations } from "next-intl/server"
import Link from "next/link"

import { AuthFormHeader, AuthFormPanel, AuthLayout } from "@/components/auth"
import { authMetadata, AuthPageBrandPanel } from "@/features/auth/auth-page"
import { SignUpFormContainer } from "@/features/auth/sign-up/sign-up-form-container"
import { localizedPath } from "@/lib/i18n/config"
import {
  resolveLocaleParams,
  type LocaleParams,
} from "@/lib/i18n/locale-params"

interface SignUpPageProps {
  params: Promise<LocaleParams>
}

export const generateMetadata = ({ params }: SignUpPageProps) =>
  authMetadata(params, "signUp")

const SignUpPage = async ({ params }: SignUpPageProps) => {
  const { country, lang } = await resolveLocaleParams(params)

  const t = await getTranslations({ locale: lang, namespace: "auth.signUp" })

  const href = (path?: string) => localizedPath(country, lang, path)

  return (
    <AuthLayout
      brandPanel={<AuthPageBrandPanel lang={lang} homeHref={href()} />}
    >
      <AuthFormPanel
        action={
          <div className="flex w-full items-center justify-end gap-4">
            <p className="text-sm">
              {t("alreadyHaveAccount")}{" "}
              <Link
                href={href("/auth/sign-in")}
                className="font-medium text-foreground underline underline-offset-4"
              >
                {t("signIn")}
              </Link>
            </p>
          </div>
        }
        footer={
          <p className="text-center text-xs text-muted-foreground">
            {t("legal.intro")}{" "}
            <Link
              href={href("/terms")}
              className="font-medium text-foreground underline underline-offset-4"
            >
              {t("legal.terms")}
            </Link>{" "}
            {t("legal.conjunction")}{" "}
            <Link
              href={href("/privacy")}
              className="font-medium text-foreground underline underline-offset-4"
            >
              {t("legal.privacy")}
            </Link>
            .
          </p>
        }
      >
        <AuthFormHeader
          title={t("form.title")}
          description={t("form.description")}
        />
        <div className="mt-8">
          <SignUpFormContainer />
        </div>
      </AuthFormPanel>
    </AuthLayout>
  )
}

export default SignUpPage
