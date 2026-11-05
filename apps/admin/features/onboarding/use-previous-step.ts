"use client"

import { useRouter } from "next/navigation"

import { useApiToast } from "@/hooks/use-api-toast"
import { useLocaleParams } from "@/hooks/use-locale-params"
import { updateOnboardingStep } from "@/lib/api/auth/update-onboarding-step"
import { ONBOARDING_PATHS } from "@/lib/bootstrap/bootstrap-path"
import { href } from "@/lib/i18n/config"

/**
 * Moves onboarding back to `step` and opens its page; a failure is toasted
 * and leaves the user where they are.
 */
export function usePreviousStep(step: "BASIC_INFORMATION" | "CHOOSE_PATH") {
  const showApiToast = useApiToast()
  const router = useRouter()
  const { country, lang } = useLocaleParams()

  return async () => {
    const result = await updateOnboardingStep({ step })
    if (!result.success) {
      showApiToast(result)
      return
    }
    router.replace(href(country, lang, ONBOARDING_PATHS[step]))
  }
}
