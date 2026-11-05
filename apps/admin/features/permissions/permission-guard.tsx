import { redirect } from "next/navigation"
import type { ReactNode } from "react"

import { canUseCountry } from "@nexora/shared/constants/country-access"

import { bootstrap } from "@/lib/api/bootstrap/helpers/bootstrap"
import { resolveBootstrapPath } from "@/lib/bootstrap/bootstrap-path"
import { href, resolveCountryLanguage } from "@/lib/i18n/config"

interface PermissionGuardProps {
  country: string
  lang: string
  children: ReactNode
}

/**
 * Renders `children` only when the user may use this /[country]: their
 * saved country always, any country until onboarding's choose-path step
 * locks it, and after that only countries they hold a UserPermission in.
 * Otherwise it sends them to their saved country, on the page they belong
 * on there, keeping the language when that country offers it.
 *
 * This only steers the app; country data must still be guarded by the
 * services serving it. Must sit inside <Suspense>, like BootstrapGuard.
 */
export const PermissionGuard = async ({
  country,
  lang,
  children,
}: PermissionGuardProps) => {
  const overview = await bootstrap(country, lang)

  if (canUseCountry(overview.countryAccess, country)) return children

  const { savedCountry } = overview.countryAccess
  const { preferredLocale } = overview.account
  const savedLang = resolveCountryLanguage(savedCountry, lang, preferredLocale)

  redirect(href(savedCountry, savedLang, resolveBootstrapPath(overview)))
}
