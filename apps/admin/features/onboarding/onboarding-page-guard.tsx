import { BootstrapGuard } from "@/features/bootstrap/bootstrap-guard"
import {
  resolveLocaleParams,
  type LocaleParams,
} from "@/lib/i18n/locale-params"
import { Suspense, type ReactNode } from "react"
import { onboardingPages, type OnboardingPage } from "./onboarding-metadata"

/**
 * Gates an onboarding page on its own path. Lives in the page rather than the
 * onboarding layout because only the page knows which path it is.
 */
export const OnboardingPageGuard = async ({
  params,
  page,
  children,
}: {
  params: Promise<LocaleParams>
  page: OnboardingPage
  children?: ReactNode
}) => {
  const { country, lang } = await resolveLocaleParams(params)

  return (
    <Suspense>
      <BootstrapGuard
        country={country}
        lang={lang}
        path={onboardingPages[page].path}
      >
        {children}
      </BootstrapGuard>
    </Suspense>
  )
}
