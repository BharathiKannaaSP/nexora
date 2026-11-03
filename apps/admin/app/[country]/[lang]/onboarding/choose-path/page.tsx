import { onboardingMetadata } from "@/features/onboarding/onboarding-metadata"
import { OnboardingPageGuard } from "@/features/onboarding/onboarding-page-guard"
import type { LocaleParams } from "@/lib/i18n/locale-params"
import ChooseYourPathForm from "@/features/onboarding/choose-your-path/choose-your-path-form"
import { getCountries } from "@/lib/api/auth/countries"
import { isCountry } from "@/lib/i18n/config"

interface ChoosePathPageProps {
  params: Promise<LocaleParams>
}

export const generateMetadata = ({ params }: ChoosePathPageProps) =>
  onboardingMetadata(params, "choosePath")

// The form can't be filled in without the country list, so a failure goes
// to the error boundary, which offers a retry.
// Only the countries Nexora is offered in can be picked here; the world list
// still supplies their flags, calling codes and time zones.
const ChooseYourPathFormWithCountries = async () => {
  const result = await getCountries()

  if (!result.success) {
    throw new Error(`Failed to load countries: ${result.code}`)
  }

  const countries = result.data.countries.filter(({ code }) =>
    isCountry(code.toLowerCase())
  )

  return <ChooseYourPathForm countries={countries} />
}

const ChoosePathPage = ({ params }: ChoosePathPageProps) => (
  <OnboardingPageGuard params={params} page="choosePath">
    <ChooseYourPathFormWithCountries />
  </OnboardingPageGuard>
)

export default ChoosePathPage
