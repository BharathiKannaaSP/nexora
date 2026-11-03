import {
  ONBOARDING_PATHS,
  ROLE_REQUIREMENTS_PATHS,
  type BootstrapPath,
} from "@/lib/bootstrap/bootstrap-path"
import {
  resolveLocaleParams,
  type LocaleParams,
} from "@/lib/i18n/locale-params"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

export const onboardingSteps = [
  "basicInformation",
  "choosePath",
  "roleRequirements",
  "review",
] as const

export type OnboardingStep = (typeof onboardingSteps)[number]

export const onboardingPages = {
  basicInformation: {
    path: ONBOARDING_PATHS.BASIC_INFORMATION,
    step: "basicInformation",
  },
  choosePath: { path: ONBOARDING_PATHS.CHOOSE_PATH, step: "choosePath" },
  becomeAdmin: {
    path: ROLE_REQUIREMENTS_PATHS.BECOME_ADMIN,
    step: "roleRequirements",
  },
  createOrganization: {
    path: ROLE_REQUIREMENTS_PATHS.CREATE_ORGANIZATION,
    step: "roleRequirements",
  },
  joinOrganization: {
    path: ROLE_REQUIREMENTS_PATHS.JOIN_ORGANIZATION,
    step: "roleRequirements",
  },
  review: { path: ONBOARDING_PATHS.REVIEW, step: "review" },
} as const satisfies Record<
  string,
  { path: BootstrapPath; step: OnboardingStep }
>

export type OnboardingPage = keyof typeof onboardingPages

export const onboardingMetadata = async (
  params: Promise<LocaleParams>,
  page: OnboardingPage
): Promise<Metadata> => {
  const { lang } = await resolveLocaleParams(params)
  const t = await getTranslations({ locale: lang, namespace: "onboarding" })

  return {
    title: t(`pages.${page}.title`),
    description: t(`pages.${page}.description`),
  }
}
