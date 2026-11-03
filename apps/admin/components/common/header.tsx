import React from "react"
import { getTranslations } from "next-intl/server"
import { lang } from "next/root-params"
import { LocaleParams, resolveLocaleParams } from "@/lib/i18n/locale-params"
import { BrandLogo } from "../branding"
import { LanguageSwitcher } from "./language-switcher"
import { SignOutButton } from "./sign-out-button"

const Header = async ({ params }: { params: Promise<LocaleParams> }) => {
  const { lang } = await resolveLocaleParams(params)

  const t = await getTranslations({ locale: lang, namespace: "onboarding" })

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b bg-background px-4 py-4 sm:px-6 lg:px-8 xl:px-10">
      <BrandLogo />
      <div className="flex gap-2">
        <LanguageSwitcher className="static" />
        <SignOutButton label={t("signOut")} />
      </div>
    </header>
  )
}

export default Header
