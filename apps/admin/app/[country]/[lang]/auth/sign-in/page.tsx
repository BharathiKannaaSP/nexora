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
import { RegisteredBanner } from "@/features/auth/sign-in/registered-banner"
import { SignInFormContainer } from "@/features/auth/sign-in/sign-in-form-container"

interface SignInPageProps {
  params: Promise<LocaleParams>
}

export async function generateMetadata({
  params,
}: SignInPageProps): Promise<Metadata> {
  const { lang } = await resolveLocaleParams(params)

  const t = await getTranslations({ locale: lang, namespace: "auth.signIn" })

  return {
    title: t("metadata.title"),
    description: t("metadata.description"),
  }
}

const SignInPage = async ({ params }: SignInPageProps) => {
  const { country, lang } = await resolveLocaleParams(params)

  const t = await getTranslations({ locale: lang, namespace: "auth.signIn" })
  // The brand panel is shared with the sign-up page.
  const tBrand = await getTranslations({
    locale: lang,
    namespace: "auth.signUp",
  })

  const href = (path?: string) => localizedPath(country, lang, path)

  const features = [
    {
      id: "products",
      icon: <ShoppingCart />,
      title: tBrand("features.products.title"),
      description: tBrand("features.products.description"),
    },
    {
      id: "analytics",
      icon: <ChartNoAxesCombined />,
      title: tBrand("features.analytics.title"),
      description: tBrand("features.analytics.description"),
    },
    {
      id: "team",
      icon: <Users />,
      title: tBrand("features.team.title"),
      description: tBrand("features.team.description"),
    },
  ]

  return (
    <AuthLayout
      brandPanel={
        <AuthBrandPanel
          portalLabel={tBrand("brand.portalLabel")}
          title={tBrand("brand.title")}
          description={tBrand("brand.description")}
          backgroundImage="/images/auth-container-bg.webp"
          features={features}
          footerTagLine={tBrand("brand.tagline")}
          homeHref={href()}
        />
      }
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
