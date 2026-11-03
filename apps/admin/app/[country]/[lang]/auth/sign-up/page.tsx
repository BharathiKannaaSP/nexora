import {
  AuthLayout,
  AuthBrandPanel,
  AuthFormPanel,
  AuthFormHeader,
} from "@/components/auth"
import { localizedPath } from "@/lib/i18n/config"
import {
  resolveLocaleParams,
  type LocaleParams,
} from "@/lib/i18n/locale-params"
import { ChartNoAxesCombined, ShoppingCart, Users } from "lucide-react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import React from "react"
import { SignUpFormContainer } from "@/features/auth/sign-up/sign-up-form-container"
interface SignUpPageProps {
  params: Promise<LocaleParams>
}

export async function generateMetadata({
  params,
}: SignUpPageProps): Promise<Metadata> {
  const { lang } = await resolveLocaleParams(params)

  const t = await getTranslations({ locale: lang, namespace: "auth.signUp" })

  return {
    title: t("metadata.title"),
    description: t("metadata.description"),
  }
}

const SignUpPage = async ({ params }: SignUpPageProps) => {
  const { country, lang } = await resolveLocaleParams(params)

  const t = await getTranslations({ locale: lang, namespace: "auth.signUp" })

  const href = (path?: string) => localizedPath(country, lang, path)

  const features = [
    {
      id: "products",
      icon: <ShoppingCart />,
      title: t("features.products.title"),
      description: t("features.products.description"),
    },
    {
      id: "analytics",
      icon: <ChartNoAxesCombined />,
      title: t("features.analytics.title"),
      description: t("features.analytics.description"),
    },
    {
      id: "team",
      icon: <Users />,
      title: t("features.team.title"),
      description: t("features.team.description"),
    },
  ]

  return (
    <AuthLayout
      brandPanel={
        <AuthBrandPanel
          portalLabel={t("brand.portalLabel")}
          title={t("brand.title")}
          description={t("brand.description")}
          backgroundImage="/images/auth-container-bg.webp"
          features={features}
          footerTagLine={t("brand.tagline")}
          homeHref={href()}
        />
      }
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
