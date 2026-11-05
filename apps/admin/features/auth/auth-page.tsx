import { ChartNoAxesCombined, ShoppingCart, Users } from "lucide-react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { AuthBrandPanel } from "@/components/auth"
import type { Locale } from "@/lib/i18n/config"
import {
  resolveLocaleParams,
  type LocaleParams,
} from "@/lib/i18n/locale-params"

/** An auth page's title and description, from auth.<page>.metadata. */
export const authMetadata = async (
  params: Promise<LocaleParams>,
  page: "signIn" | "signUp" | "verifyEmail"
): Promise<Metadata> => {
  const { lang } = await resolveLocaleParams(params)
  const t = await getTranslations({ locale: lang, namespace: "auth" })

  return {
    title: t(`${page}.metadata.title`),
    description: t(`${page}.metadata.description`),
  }
}

const FEATURES = [
  { id: "products", Icon: ShoppingCart },
  { id: "analytics", Icon: ChartNoAxesCombined },
  { id: "team", Icon: Users },
] as const

/** The brand panel beside the sign-in and sign-up forms. */
export const AuthPageBrandPanel = async ({
  lang,
  homeHref,
}: {
  lang: Locale
  homeHref: string
}) => {
  const t = await getTranslations({ locale: lang, namespace: "auth.signUp" })

  return (
    <AuthBrandPanel
      portalLabel={t("brand.portalLabel")}
      title={t("brand.title")}
      description={t("brand.description")}
      backgroundImage="/images/auth-container-bg.webp"
      features={FEATURES.map(({ id, Icon }) => ({
        id,
        icon: <Icon />,
        title: t(`features.${id}.title`),
        description: t(`features.${id}.description`),
      }))}
      footerTagLine={t("brand.tagline")}
      homeHref={homeHref}
    />
  )
}
